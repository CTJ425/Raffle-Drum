import { io, type Socket } from "socket.io-client";

const explicitUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
const url = explicitUrl || (import.meta.env.DEV ? "http://localhost:5000" : undefined);

export const socket: Socket = url ? io(url) : io();
