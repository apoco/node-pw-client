#ifndef PIPEWIRE_SESSION_HPP
#define PIPEWIRE_SESSION_HPP

#include <napi.h>
#include <pipewire/thread-loop.h>

class PipeWireSession : public Napi::ObjectWrap<PipeWireSession> {

public:
    static Napi::FunctionReference constructor;
    static Napi::Function init(const Napi::Env& env);
    PipeWireSession(const Napi::CallbackInfo& info);
    ~PipeWireSession();

    Napi::Value start(const Napi::CallbackInfo& info);
    Napi::Value destroy(const Napi::CallbackInfo& info);

    void withThreadLock(std::function<void()> fn);
    pw_loop* getLoop();

    Napi::Value createAudioOutputStream(const Napi::CallbackInfo& info);

private:
    pw_thread_loop* loop;
    pw_context* context;
    pw_core* core;
    volatile bool isStopping;
};

#endif // PIPEWIRE_SESSION_HPP
