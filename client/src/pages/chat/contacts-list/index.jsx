import React from "react";
import logo from "@/assets/logosite.svg";
import ProfileInfoComponent from "./components/profile-info";
import AddContact from "./components/add-contact";

function ContactsListContainer() {
  return (
    <div className="relative md:w-[40vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full ">
      <div className="pt-3 flex justify-center mb-10">
        <img src={logo} alt="logo" className="w-36 h-36 " />
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Messaggi Diretti" />
          <AddContact />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Canali" />
        </div>
      </div>
      <ProfileInfoComponent />
    </div>
  );
}

export default ContactsListContainer;

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-5 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
