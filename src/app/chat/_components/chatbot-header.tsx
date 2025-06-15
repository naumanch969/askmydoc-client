import React from "react";
import PlanButton from "./plan-button";
import { UserButton } from "@clerk/nextjs";



const ChatbotNavbar = ({ }) => {
  return (
    <div className="h-16 bg-neutral px-4 py-3 flex justify-between items-center border-b">

      <PlanButton />

      <div className="flex gap-3">

        <UserButton />

      </div>
    </div>
  );
};

export default ChatbotNavbar;
