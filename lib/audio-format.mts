import { endianness } from "node:os";
import {
  TypedNumericArray,
  TypedNumericArrayCtor,
} from "./audio-output-stream.mjs";

export type OutputBufferFactory = (numSamples: number) => OutputBuffer;

interface OutputBuffer {
  get buffer(): ArrayBuffer;
  set(index: number, signedFloat: number): void;
  subarray(index: number, sampleCount: number): OutputBuffer;
}

function fpOutputBuffer(ctor: TypedNumericArrayCtor): OutputBufferFactory {
  class WrappedTypeArray {
    #buffer: TypedNumericArray;

    constructor(buffer: TypedNumericArray) {
      this.#buffer = buffer;
    }

    set(index: number, value: number) {
      this.#buffer[index] = value;
    }

    get buffer() {
      return this.#buffer.buffer;
    }

    subarray(offset: number, size: number) {
      return new WrappedTypeArray(this.#buffer.subarray(offset, size));
    }
  }

  return (samples: number) => new WrappedTypeArray(new ctor(samples));
}

function intOutputBuffer(
  ctor: TypedNumericArrayCtor,
  encode: (fpSigned: number) => number
): OutputBufferFactory {
  class WrappedTypeArray {
    #buffer: TypedNumericArray;

    constructor(buffer: TypedNumericArray) {
      this.#buffer = buffer;
    }

    set(index: number, value: number) {
      const encoded = encode(value);
      this.#buffer[index] = encoded;
    }

    get buffer() {
      return this.#buffer.buffer;
    }

    subarray(offset: number, size: number) {
      return new WrappedTypeArray(this.#buffer.subarray(offset, size));
    }
  }

  return (samples: number) => new WrappedTypeArray(new ctor(samples));
}

function signedInt(bits: number) {
  const multiplier = 2 ** (bits - 1) - 0.5;
  return (n: number) => Math.floor(n * multiplier);
}

function unsignedInt(bits: number) {
  const multiplier = (2 ** bits - 1) / 2;
  return (n: number) => Math.floor((n + 1) * multiplier);
}

const Int8Buffer = intOutputBuffer(Int8Array, signedInt(8));
const Int16Buffer = intOutputBuffer(Int16Array, signedInt(16));
const Int32Buffer = intOutputBuffer(Int32Array, signedInt(32));
const Uint8Buffer = intOutputBuffer(Uint8Array, unsignedInt(8));
const Uint16Buffer = intOutputBuffer(Uint16Array, unsignedInt(16));
const Uint32Buffer = intOutputBuffer(Uint32Array, unsignedInt(32));
const Float32Buffer = fpOutputBuffer(Float32Array);
const Float64Buffer = fpOutputBuffer(Float64Array);

export class AudioFormat {
  #enumValue: number;
  #byteSize: number;
  #bufferFactory: OutputBufferFactory;

  constructor(
    value: number,
    byteSize: number,
    BufferClass: OutputBufferFactory
  ) {
    this.#enumValue = value;
    this.#byteSize = byteSize;
    this.#bufferFactory = BufferClass;
    AudioFormat.#enumMap.set(value, this);
  }

  get enumValue() {
    return this.#enumValue;
  }

  get byteSize() {
    return this.#byteSize;
  }

  get BufferClass() {
    return this.#bufferFactory;
  }

  static #enumMap = new Map<number, AudioFormat>();

  static fromEnum(format: number) {
    return AudioFormat.#enumMap.get(format);
  }

  static Int8 = new AudioFormat(0x101, 1, Int8Buffer);
  static Uint8 = new AudioFormat(0x102, 1, Uint8Buffer);

  static get Int16() {
    return endianness() === "BE" ? AudioFormat.Int16BE : AudioFormat.Int16LE;
  }

  static get Uint16() {
    return endianness() === "BE" ? AudioFormat.Uint16BE : AudioFormat.Uint16LE;
  }

  static get Int24_32() {
    return endianness() === "BE"
      ? AudioFormat.Int24_32BE
      : AudioFormat.Int24_32LE;
  }

  static get Uint24_32() {
    return endianness() === "BE"
      ? AudioFormat.Uint24_32BE
      : AudioFormat.Uint24_32LE;
  }

  static get Int32() {
    return endianness() === "BE" ? AudioFormat.Int32BE : AudioFormat.Int32LE;
  }

  static get Uint32() {
    return endianness() === "BE" ? AudioFormat.Uint32BE : AudioFormat.Uint32LE;
  }

  // static get Int24() {
  //   return endianness() === "BE" ? AudioFormat.Int24BE : AudioFormat.Int24LE;
  // }

  // static get Uint24() {
  //   return endianness() === "BE" ? AudioFormat.Uint24BE : AudioFormat.Uint24LE;
  // }

  // static get Int20() {
  //   return endianness() === "BE" ? AudioFormat.Int20BE : AudioFormat.Int20LE;
  // }

  // static get Uint20() {
  //   return endianness() === "BE" ? AudioFormat.Uint20BE : AudioFormat.Uint20LE;
  // }

  // static get Int18() {
  //   return endianness() === "BE" ? AudioFormat.Int18BE : AudioFormat.Int18LE;
  // }

  // static get Uint18() {
  //   return endianness() === "BE" ? AudioFormat.Uint18BE : AudioFormat.Uint18LE;
  // }

  static get Float32() {
    return endianness() === "BE"
      ? AudioFormat.Float32BE
      : AudioFormat.Float32LE;
  }

  static get Float64() {
    return endianness() === "BE"
      ? AudioFormat.Float64BE
      : AudioFormat.Float64LE;
  }

  static ULaw = new AudioFormat(0x11f, 1, Int8Buffer);
  static ALaw = new AudioFormat(0x120, 1, Int8Buffer);

  static Uint8Planar = new AudioFormat(0x201, 1, Uint8Buffer);
  static Int16Planar = new AudioFormat(0x202, 2, Int16Buffer);
  static Int24_32Planar = new AudioFormat(0x203, 4, Int32Buffer);
  static Int32Planar = new AudioFormat(0x204, 4, Int32Buffer);
  // static Int24Planar = new AudioFormat(0x205, 3);
  static Float32Planar = new AudioFormat(0x206, 4, Float32Buffer);
  static Float64Planar = new AudioFormat(0x207, 8, Float64Buffer);
  static Int8Planar = new AudioFormat(0x208, 1, Int8Buffer);

  // Endian-specific
  private static Int16LE = new AudioFormat(0x103, 2, Int16Buffer);
  private static Int16BE = new AudioFormat(0x104, 2, Int16Buffer);
  private static Uint16LE = new AudioFormat(0x105, 2, Uint16Buffer);
  private static Uint16BE = new AudioFormat(0x106, 2, Uint16Buffer);
  private static Int24_32LE = new AudioFormat(0x107, 4, Int32Buffer);
  private static Int24_32BE = new AudioFormat(0x108, 4, Int32Buffer);
  private static Uint24_32LE = new AudioFormat(0x109, 4, Uint32Buffer);
  private static Uint24_32BE = new AudioFormat(0x10a, 4, Uint32Buffer);
  private static Int32LE = new AudioFormat(0x10b, 4, Int32Buffer);
  private static Int32BE = new AudioFormat(0x10c, 4, Int32Buffer);
  private static Uint32LE = new AudioFormat(0x10d, 4, Uint32Buffer);
  private static Uint32BE = new AudioFormat(0x10e, 4, Uint32Buffer);
  // private static Int24LE = new AudioFormat(0x10f, 3);
  // private static Int24BE = new AudioFormat(0x110, 3);
  // private static Uint24LE = new AudioFormat(0x111, 3);
  // private static Uint24BE = new AudioFormat(0x112, 3);
  // private static Int20LE = new AudioFormat(0x113, 4); // No idea how to encode...
  // private static Int20BE = new AudioFormat(0x114, 4); // No idea...
  // private static Uint20LE = new AudioFormat(0x115, 4); // No idea...
  // private static Uint20BE = new AudioFormat(0x116, 4); // No idea...
  // private static Int18LE = new AudioFormat(0x117, 3); // No idea...
  // private static Int18BE = new AudioFormat(0x118, 3); // No idea...
  // private static Uint18LE = new AudioFormat(0x119, 3); // No idea...
  // private static Uint18BE = new AudioFormat(0x11a, 3); // No idea...
  private static Float32LE = new AudioFormat(0x11b, 4, Float32Buffer);
  private static Float32BE = new AudioFormat(0x11c, 4, Float32Buffer);
  private static Float64LE = new AudioFormat(0x11d, 8, Float64Buffer);
  private static Float64BE = new AudioFormat(0x11e, 8, Float64Buffer);
}
