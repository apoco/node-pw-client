#include <iostream>
#include <napi.h>
#include <pipewire/keys.h>
#include <pipewire/pipewire.h>

#include "audio-output-stream.hpp"
#include "promises.hpp"
#include "session.hpp"

using namespace std;

Napi::FunctionReference PipeWireSession::constructor;
void normalizeStreamProps(const Napi::Object& createOpts);
void populateMediaProps(const Napi::Object& streamProps, const Napi::Value& maybeMedia);

Napi::Function PipeWireSession::init(const Napi::Env& env)
{
    auto ctor = DefineClass(
        env,
        "PipeWireSession",
        {
            InstanceMethod<&PipeWireSession::start>(
                "start", napi_enumerable),
            InstanceMethod<&PipeWireSession::createAudioOutputStream>(
                "createAudioOutputStream", napi_enumerable),
            InstanceMethod<&PipeWireSession::destroy>(
                "destroy", napi_enumerable),
        });

    constructor = Napi::Persistent(ctor);
    constructor.SuppressDestruct();

    return ctor;
}

PipeWireSession::PipeWireSession(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<PipeWireSession>(info)
    , loop(NULL)
    , context(NULL)
    , core(NULL)
    , isStopping(false)
{
}

PipeWireSession::~PipeWireSession()
{
    // Only clean up if destroy() wasn't called (resources should already be null)
    if (!isStopping && loop) {
        pw_thread_loop_stop(loop);
    }

    if (core) {
        pw_core_disconnect(core);
    }
    if (context) {
        pw_context_destroy(context);
    }
    if (loop) {
        pw_thread_loop_destroy(loop);
    }
}

pw_loop* PipeWireSession::getLoop()
{
    return pw_thread_loop_get_loop(loop);
}

void PipeWireSession::withThreadLock(std::function<void()> fn)
{
    pw_thread_loop_lock(loop);
    fn();
    pw_thread_loop_unlock(loop);
}

Napi::Value PipeWireSession::start(const Napi::CallbackInfo& info)
{
    auto env = info.Env();
    Ref(); // Keep object alive during async operation

    return async(
        env,
        [this]() {
            spa_dict threadProps = {};
            loop = pw_thread_loop_new("PipeWireSession", &threadProps);

            withThreadLock([this]() {
                pw_thread_loop_start(loop);
                context = pw_context_new(pw_thread_loop_get_loop(loop), NULL, 0);
                core = pw_context_connect(context, NULL, 0);
            });
        },
        [this, env]() {
            return env.Undefined();
        });
}

Napi::Value PipeWireSession::createAudioOutputStream(const Napi::CallbackInfo& info)
{
    Napi::Object createOpts = info[0].As<Napi::Object>();

    auto jsStream = AudioOutputStream::constructor.New({});
    auto stream = AudioOutputStream::Unwrap(jsStream);

    return stream->create(this, createOpts);
}

Napi::Value PipeWireSession::destroy(const Napi::CallbackInfo& info)
{
    auto env = info.Env();

    if (isStopping) {
        return resolved(env.Undefined());
    }

    isStopping = true;

    return async(env, [this, env]() {
        // Clean up PipeWire resources in correct order with thread lock
        if (loop) {
            withThreadLock([this]() {
                // 1. Disconnect the core interface first
                if (core) {
                    pw_core_disconnect(core);
                    core = NULL;
                }

                // 2. Destroy the context
                if (context) {
                    pw_context_destroy(context);
                    context = NULL;
                }
            });

            // 3. Stop and destroy the thread loop (outside the lock)
            pw_thread_loop_stop(loop);
            pw_thread_loop_destroy(loop);
            loop = NULL;
        }

        // Success callback - unref to allow garbage collection and return undefined
        this->Unref();
        return env.Undefined(); // Return proper undefined value
    });
}
