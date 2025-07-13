#include <napi.h>

class PromiseWorker : private Napi::AsyncWorker {
public:
    PromiseWorker(
        Napi::Env env,
        std::function<void()> fn)
        : PromiseWorker(env, fn, [env]() {
            return env.Undefined();
        })
    {
    }

    PromiseWorker(
        Napi::Env env,
        std::function<void()> fn,
        std::function<Napi::Value()> resolveAs)
        : AsyncWorker(env)
        , deferred(Napi::Promise::Deferred::New(env))
        , env(env)
        , fn(fn)
        , resolveAs(resolveAs)
    {
    }

    Napi::Promise start()
    {
        this->Queue();
        return deferred.Promise();
    }

private:
    Napi::Promise::Deferred deferred;
    Napi::Env env;
    std::function<void()> fn;
    std::function<Napi::Value()> resolveAs;

    void Execute() override
    {
        fn();
    }

    void OnOK() override
    {
        deferred.Resolve(resolveAs());
    }

    void OnError(const Napi::Error& error)
    {
        deferred.Reject(error.Value());
    }
};

Napi::Promise async(Napi::Env env, std::function<void()> fn)
{
    auto worker = new PromiseWorker(env, fn);
    return worker->start();
}

Napi::Promise async(
    Napi::Env env,
    std::function<void()> fn,
    std::function<Napi::Value()> resolveAs)
{
    auto worker = new PromiseWorker(env, fn, resolveAs);
    return worker->start();
}

Napi::Promise resolved(Napi::Value value)
{
    auto deferred = Napi::Promise::Deferred::New(value.Env());
    deferred.Resolve(value);
    return deferred.Promise();
}

Napi::Promise rejected(Napi::Error err)
{
    auto deferred = Napi::Promise::Deferred::New(err.Env());
    deferred.Reject(err.Value());
    return deferred.Promise();
}
