{
  "targets": [
    {
      "target_name": "@jacobsoft/pipewire",
      "sources": [
        "src/pipewire.cpp",
        "src/promises.cpp",
        "src/session.cpp",
        "src/audio-output-stream.cpp"
      ],
      "cflags_cc": [
        "-std=c++20"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except_all",
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "<!(node -e \"require('node-addon-api').gyp\")",
        "/usr/include/pipewire-0.3",
        "/usr/include/spa-0.2",
      ],
      "link_settings": {
        "libraries": [
          "/usr/lib/x86_64-linux-gnu/libpipewire-0.3.so"
        ]
      },
    }
  ]
}