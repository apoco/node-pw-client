export enum Client {
  /** protocol used for connection */
  Protocol = "pipewire.protocol",
  /** how the client access is controlled */
  Access = "pipewire.access",
  /** how the client wants to be access controlled **/
  ClientAccess = "pipewire.client.access",
}

export enum Security {
  /** Various keys related to the identity of a client process and its security. */
  Pid = "pipewire.sec.pid",
  /** Client uid, set by protocol. */
  Uid = "pipewire.sec.uid",
  /** client gid, set by protocol **/
  Gid = "pipewire.sec.gid",
  /** client security label, set by protocol */
  Label = "pipewire.sec.label",
  /** client socket name, set by protocol */
  Socket = "pipewire.sec.socket",
  /** client secure context engine, set by protocol. */
  Engine = "pipewire.sec.engine",
  /** client secure application id */
  AppId = "pipewire.sec.app-id",
  /** client secure instance id */
  InstanceId = "pipewire.sec.instance-id",
}

export enum LibraryName {
  /** name of the system library to use */
  System = "library.name.system",
  /** name of the loop library to use */
  Loop = "library.name.loop",
  /** name of the dbus library to use */
  Dbus = "library.name.dbus",
}

export enum Object {
  /** object properties */
  Path = "object.path",
  /** a global object id */
  Id = "object.id",
  /** a 64 bit object serial number. */
  Serial = "object.serial",
  /** the object lives on even after the client that created it has been destroyed */
  Linger = "object.linger",
  /** If the object should be registered. */
  Register = "object.register",
  /** If the object should be exported, since 0.3.72. */
  Export = "object.export",
}

export enum ConfigFile {
  /** a config prefix directory */
  Prefix = "config.prefix",
  /** a config file name */
  Name = "config.name",
  /** a config override prefix directory */
  OverridePrefix = "config.override.prefix",
  /** a config override file name */
  OverrideName = "config.override.name",
}

export enum Loop {
  /** the name of a loop */
  Name = "loop.name",
  /** the classes this loop handles, array of strings */
  Class = "loop.class",
  /** realtime priority of the loop */
  RealtimePriority = "loop.rt-prio",
  /** if the loop can be canceled */
  Cancelable = "loop.cancel",
}

export enum Core {
  /** The name of the core. */
  Name = "core.name",
  /** The version of the core. */
  Version = "core.version",
  /** If the core is listening for connections. */
  IsDaemon = "core.daemon",
  /** the core id */
  Id = "core.id",
  /** the apis monitored by core. */
  Monitors = "core.monitors",
}

export enum Context {
  /** The user name that runs pipewire. */
  UserName = "context.user-name",
  /** The host name of the machine. */
  HostName = "context.host-name",
}

export enum CPU {
  /** maximum alignment needed to support all CPU optimizations */
  CpuMaxAlignment = "cpu.max-align",
  /** number of cores */
  CpuCores = "cpu.cores",
}

export enum Priority {
  /** priority in session manager */
  Session = "priority.session",
  /** priority to be a driver */
  Driver = "priority.driver",
}

export enum Remote {
  /** The name of the remote to connect to, default pipewire-0, overwritten by env(PIPEWIRE_REMOTE). */
  Name = "remote.name",
  /** The intention of the remote connection, "generic", "screencast", "manager". */
  Intention = "remote.intention",
}

export enum Process {
  /** process id (pid) */
  Id = "application.process.id",
  /** binary name */
  Binary = "application.process.binary",
  /** user name */
  UserName = "application.process.user",
  /** host name */
  HostName = "application.process.host",
  /** the D-Bus host id the application runs on */
  MachineId = "application.process.machine-id",
  /** login session of the application, on Unix the value of $XDG_SESSION_ID. */
  SessionId = "application.process.session-id",
}

export enum Application {
  /** application keys */
  Name = "application.name",
  /** a textual id for identifying an application logically. */
  Id = "application.id",
  /** application version. */
  Version = "application.version",
  /** aa base64 blob with PNG image data */
  Icon = "application.icon",
  /** an XDG icon name for the application. */
  IconName = "application.icon-name",
  /** application language if applicable, in standard POSIX format. */
  Language = "application.language",
  /** window system */
  X11Display = "window.x11.display",
}

export enum Client {
  /** Client properties. */
  Id = "client.id",
  /** the client name */
  Name = "client.name",
  /** the client api used to access PipeWire */
  Api = "client.api",
}

export enum Node {
  /** Node keys. */
  Id = "node.id",
  /** node name */
  Name = "node.name",
  /** short node name */
  Nickname = "node.nick",
  /** localized human readable node one-line description. */
  Description = "node.description",
  /** when the node was created. */
  Plugged = "node.plugged",
  /** the session id this node is part of */
  SessionId = "node.session",
  /** the group id this node is part of. */
  GroupId = "node.group",
  /** the sync group this node is part of. */
  SyncGroup = "node.sync-group",
  /** if the sync-group is active or not */
  SyncGroupActive = "node.sync",
  /** if the transport is active or not */
  TransportActive = "node.transport",
  /** node wants exclusive access to resources */
  IsExclusive = "node.exclusive",
  /** node wants to be automatically connected to a compatible node */
  Autoconnect = "node.autoconnect",
  /** the requested latency of the node as a fraction. */
  Latency = "node.latency",
  /** the maximum supported latency of the node as a fraction. */
  MaxLatency = "node.max-latency",
  /** don't change quantum when this node is active */
  LockQuantum = "node.lock-quantum",
  /** force a quantum while the node is active */
  ForceQuantum = "node.force-quantum",
  /** the requested rate of the graph as a fraction. */
  Rate = "node.rate",
  /** don't change rate when this node is active */
  LockRate = "node.lock-rate",
  /** force a rate while the node is active. */
  ForceRate = "node.force-rate",
  /** don't reconnect this node. */
  DoNotReconnect = "node.dont-reconnect",
  /** process even when unlinked */
  AlwaysProcess = "node.always-process",
  /** the node wants to be grouped with a driver node in order to schedule the graph. */
  WantsDriver = "node.want-driver",
  /** pause the node when idle */
  PauseOnIdle = "node.pause-on-idle",
  /** suspend the node when idle */
  SuspendOnIdle = "node.suspend-on-idle",
  /** cache the node params */
  CacheParams = "node.cache-params",
  /** the node handles transport sync */
  TransportSync = "node.transport.sync",
  /** node can drive the graph. */
  IsDriver = "node.driver",
  /** the node can be a lazy driver. */
  IsLazyDriver = "node.supports-lazy",
  /** The node supports emiting RequestProcess events when it wants the graph to be scheduled. */
  SupportsRequest = "node.supports-request",
  /** the node id of the node assigned as driver for this node */
  DriverId = "node.driver-id",
  /** the node wants async scheduling */
  AsyncScheduling = "node.async",
  /** the loop name fnmatch pattern to run in */
  LoopName = "node.loop.name",
  /** the loop class fnmatch pattern to run in */
  LoopClass = "node.loop.class",
  /** node is a stream, the server side should add a converter */
  IsStream = "node.stream",
  /** the node is some sort of virtual object */
  IsVirtual = "node.virtual",
  /** indicate that a node wants passive links on output/input/all ports when the value is "out"/"in"/"true" respectively */
  PassiveLinks = "node.passive",
  /** the node is internally linked to nodes with the same link-group. */
  LinkGroup = "node.link-group",
  /** the node is on a network */
  OnNetwork = "node.network",
  /** the node is not scheduled automatically based on the dependencies in the graph but it will be triggered explicitly. */
  ExplicitlyTriggered = "node.trigger",
  /** names of node's channels (unrelated to positions) */
  ChannelNames = "node.channel-names",
  /** override port name prefix for device ports, like capture and playback or disable the prefix completely if an empty string is provided */
  DevicePortPrefix = "node.device-port-name-prefix",
}

export enum Port {
  /** Port keys. */
  Id = "port.id",
  /** port name */
  Name = "port.name",
  /** the port direction, one of "in" or "out" or "control" and "notify" for control ports */
  Direction = "port.direction",
  /** port alias */
  Alias = "port.alias",
  /** if this is a physical port */
  IsPhysical = "port.physical",
  /** if this port consumes the data */
  IsTerminal = "port.terminal",
  /** if this port is a control port */
  IsControl = "port.control",
  /** if this port is a monitor port */
  IsMonitor = "port.monitor",
  /** cache the node port params */
  CacheParams = "port.cache-params",
  /** api specific extra port info, API name should be prefixed. */
  Extra = "port.extra",
  /** the ports wants passive links, since 0.3.67 */
  PassiveLinks = "port.passive",
  /** latency ignored by peers, since 0.3.71 */
  IgnoreLatency = "port.ignore-latency",
  /** the port group of the port 1.2.0 */
  PortGroup = "port.group",
}

export enum Link {
  /** link properties */
  Id = "link.id",
  /** input node id of a link */
  InputNodeId = "link.input.node",
  /** input port id of a link */
  InputPortId = "link.input.port",
  /** output node id of a link */
  OutputNodeId = "link.output.node",
  /** output port id of a link */
  OutputPortId = "link.output.port",
  /** indicate that a link is passive and does not cause the graph to be runnable. */
  IsPassive = "link.passive",
  /** indicate that a link is a feedback link and the target will receive data in the next cycle */
  IsFeedback = "link.feedback",
  /** the link is using async io */
  IsAsync = "link.async",
  /** a target object to link to. */
  TargetObject = "target.object",
}

export enum Device {
  /** device properties */
  Id = "device.id",
  /** device name */
  Name = "device.name",
  /** when the device was created. */
  Plugged = "device.plugged",
  /** a short device nickname */
  Nickname = "device.nick",
  /** device string in the underlying layer's format. */
  String = "device.string",
  /** API this device is accessed with. */
  Api = "device.api",
  /** localized human readable device one-line description. */
  Description = "device.description",
  /** bus path to the device in the OS' format. */
  BusPath = "device.bus-path",
  /** Serial number if applicable. */
  SerialNumber = "device.serial",
  /** vendor ID if applicable */
  VendorId = "device.vendor.id",
  /** vendor name if applicable */
  VendorName = "device.vendor.name",
  /** product ID if applicable */
  ProductId = "device.product.id",
  /** product name if applicable */
  ProductName = "device.product.name",
  /** device class */
  Class = "device.class",
  /** form factor if applicable. */
  FormFactor = "device.form-factor",
  /** bus of the device if applicable. */
  Bus = "device.bus",
  /** device subsystem */
  Subsystem = "device.subsystem",
  /** device sysfs path */
  FsPath = "device.sysfs.path",
  /** icon for the device. */
  Icon = "device.icon",
  /** an XDG icon name for the device. */
  IconName = "device.icon-name",
  /** intended use. */
  IntendedRoles = "device.intended-roles",
  /** cache the device spa params */
  CacheParams = "device.cache-params",
}

export enum Module {
  /** module properties */
  Id = "module.id",
  /** the name of the module */
  Name = "module.name",
  /** the author's name */
  Author = "module.author",
  /** a human readable one-line description of the module's purpose. */
  Description = "module.description",
  /** a human readable usage description of the module's arguments. */
  Usage = "module.usage",
  /** a version string for the module. */
  Version = "module.version",
  /** the module is deprecated with this message */
  Deprecated = "module.deprecated",
}

export enum Factory {
  /** Factory properties. */
  Id = "factory.id",
  /** the name of the factory */
  Name = "factory.name",
  /** the usage of the factory */
  Usage = "factory.usage",
  /** the name of the type created by a factory */
  TypeName = "factory.type.name",
  /** the version of the type created by a factory */
  TypeVersion = "factory.type.version",
}

export enum Stream {
  /** Stream properties. */
  IsLive = "stream.is-live",
  /** The minimum latency of the stream. */
  LatencyMin = "stream.latency.min",
  /** The maximum latency of the stream. */
  LatencyMax = "stream.latency.max",
  /** Indicates that the stream is monitoring and might select a less accurate but faster conversion algorithm. */
  IsMonitoring = "stream.monitor",
  /** don't remix channels */
  DoNotRemix = "stream.dont-remix",
  /** Try to capture the sink output instead of source output. */
  CaptureSink = "stream.capture.sink",
}

export enum Media {
  /** Media. */
  Type = "media.type",
  /** Media Category: Playback, Capture, Duplex, Monitor, Manager. */
  Category = "media.category",
  /** Role: Movie, Music, Camera, Screen, Communication, Game, Notification, DSP, Production, Accessibility, Test. */
  Role = "media.role",
  /** class Ex: "Video/Source" */
  Class = "media.class",
  /** media name. */
  Name = "media.name",
  /** title. */
  Title = "media.title",
  /** artist. */
  Artist = "media.artist",
  /** album. */
  Album = "media.album",
  /** copyright string */
  Copyright = "media.copyright",
  /** generator software */
  Software = "media.software",
  /** language in POSIX format. */
  Language = "media.language",
  /** filename */
  Filename = "media.filename",
  /** icon for the media, a base64 blob with PNG image data */
  Icon = "media.icon",
  /** an XDG icon name for the media. */
  IconName = "media.icon-name",
  /** extra comment */
  Comment = "media.comment",
  /** date of the media */
  Date = "media.date",
  /** format of the media */
  Format = "media.format",
  /** format related properties */
  Dsp = "format.dsp",
}

export enum Audio {
  /** audio related properties */
  Channel = "audio.channel",
  /** an audio samplerate */
  SampleRate = "audio.rate",
  /** number of audio channels */
  NumChannels = "audio.channels",
  /** an audio format. */
  Format = "audio.format",
  /** a list of allowed samplerates ex. */
  AllowedRates = "audio.allowed-rates",
}

export enum Video {
  /** video related properties */
  Rate = "video.framerate",
  /** a video format */
  Format = "video.format",
  /** a video size as "<width>x<height" */
  Size = "video.size",
}
