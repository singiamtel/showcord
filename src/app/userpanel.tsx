"use client";
import IconProfile from "@/assets/profile";
import { FormEvent, useContext, useEffect, useState } from "react";
import { PS_context } from "./PS_context";
import { userColor } from "@/utils/namecolour";
import Modal from "./modal";

export default function UserPanel() {
  // const [showModal, setShowModal] = useState<boolean>(false); // [username, setUsername
  const { client, user } = useContext(PS_context);

  // const onSubmit = (e: FormEvent<HTMLFormElement>) => {
  //   console.log("submitted login");
  //   e.preventDefault();
  //   const formD = new FormData(e.currentTarget);
  //   const username = formD.get("username");
  //   const password = formD.get("password");
  //   if (client) {
  //     client.login({
  //       username: username as string,
  //       password: password as string,
  //     });
  //   } else {
  //     console.error("Tried to login before the client was ready")
  //   }
  // };

  // useEffect(() => {
  //   setShowModal(false);
  // }, [user, setShowModal]);

  return (
    <div className="h-20 text-white p-3 flex items-center">
      {/*showModal &&
        (
          <Modal onClose={() => setShowModal(false)}>
            <div className="flex flex-col items-center p-12">
              <form onSubmit={onSubmit}>
                <div className="flex flex-col w-full mt-2">
                  <label className="text-white pr-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-auto bg-white"
                    type="text"
                    id="username"
                    name="username"
                  />
                </div>
                <div className="flex flex-col w-fullmt-2">
                  <label className="text-white pr-3" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="w-auto bg-white"
                    type="password"
                    id="password"
                    name="password"
                  />
                </div>
                <div className="flex flex-row w-full items-center justify-between mt-2">
                  <button
                    type="submit"
                    className="bg-blue-200 text-white p-2 rounded font-bold"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-white p-2 rounded font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )*/}
      <span
        className={"rounded text-lg flex flex-row items-center h-auto " +
          (user ? "bg-gray-600 w-auto p-2 " : "bg-gray-600 w-full font-bold ")}
      >
        {user
          ? (
            <>
              <IconProfile className="mr-2 m-auto" />
              <span
                style={{ color: userColor(user) }}
                className="font-bold"
              >
                {user}
              </span>
            </>
          )
          : (
            <>
              <button
                onClick={() => client?.login()}
                className="font-bold rounded px-2 py-1 w-full"
              >
                Login
              </button>
            </>
          )}
      </span>
    </div>
  );
}
