#include <napi.h>
#include <pipewire/pipewire.h>

#include "audio-output-stream.hpp"
#include "promises.hpp"
#include "session.hpp"

class PipeWireAddon : public Napi::Addon<PipeWireAddon> {

public:
    PipeWireAddon(Napi::Env env, Napi::Object exports)
    {
        pw_init(NULL, NULL);

        DefineAddon(
            exports,
            { InstanceValue(
                  "PipeWireSession",
                  PipeWireSession::init(env),
                  napi_enumerable),
                InstanceValue(
                    "PipeWireStream",
                    AudioOutputStream::init(env),
                    napi_enumerable) });
    }

    ~PipeWireAddon()
    {
        pw_deinit();
    }
};

NODE_API_ADDON(PipeWireAddon)
