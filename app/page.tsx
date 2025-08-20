"use client";

import dynamic from "next/dynamic";
import Sidebar from "./components/Sidebar";

const Map = dynamic(() => import("./components/map"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen w-full flex">
      <div className="basis-[20%] h-screen overflow-auto">
        <Sidebar />
      </div>
      <div className="basis-[80%] h-screen">
        <Map />
      </div>
    </div>
  );
}
