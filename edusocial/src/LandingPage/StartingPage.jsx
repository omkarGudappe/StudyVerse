import React from "react";
import UsesOfStudyVerse from "./UsesOfStudyVerse";

const StartingPage = () => {
  return (
    <div className=" bg-neutral-900">
      <div className="flex justify-center items-center h-screen text-white">
        <nav className="flex bg-neutral-800 fixed top-0 w-full h-16 items-center px-12">
          <a href="/">
            <img src="/LOGO/StudyVerseLogo2.png" className="w-50" alt="Logo" />
          </a>
          <div className="flex justify-center items-center ml-auto gap-x-3">
            <a
              href="/login"
              className="text-white  hover:bg-blue-500 p-2 text-center rounded-lg w-19 "
            >
              Log In
            </a>
            <a
              href="/signup"
              className="text-white text-center ml-4 bg-neutral-600 rounded-lg p-2 w-19"
            >
              Sign In
            </a>
          </div>
        </nav>
        <div className="flex justify-center items-center h-full gap-y-6">
          <div className="flex flex-col gap-y-6 max-w-2xl p-6">
            <h1 className="text-4xl font-medium">
              A social learning platform where students connect, learn, and grow
              together.
            </h1>
            <p className="text-lg">
              StudyVerse is a modern learning social network built for students.
              Discover lessons, create and share notes, post teaching videos, and
              connect with classmates or peers worldwide. Whether you’re revising
              for exams or exploring new skills, StudyVerse makes learning
              engaging, social, and fun.
            </p>
            <div className="flex gap-x-3 w-2xl">
              <input className="border w-full border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter Email" />
              <button className="bg-blue-500 w-20 text-white p-2 rounded-lg mr-4 hover:scale-105 text-center cursor-pointer active:scale-95">Sign In</button>
            </div>
          </div>
          <div className="flex items-center justify-center">
              <img src="/Images/Student.png" className="w-lg" alt="" />
          </div>
        </div>
      </div>
      {/* <UsesOfStudyVerse/> */}
    </div>
  );
};

export default StartingPage;
