import React from "react";
import { motion } from "framer-motion";

const UsesOfStudyVerse = () => {
  const Icons = [
    {
      id: 1,
      icon: (
        <i className="fa-solid fa-people-group text-4xl bg-purple-600 bg-clip-text text-transparent"></i>
      ),
      title: "Community Building",
    },
    {
      id: 2,
      icon: (
        <i className="fa-solid fa-play text-4xl bg-cyan-500 bg-clip-text text-transparent"></i>
      ),
      title: "Upload and Watch Video Lessons",
    },
    {
      id: 3,
      icon: (
        <i className="fa-solid fa-book text-4xl bg-amber-500 bg-clip-text text-transparent"></i>
      ),
      title: "Note Creating and Sharing",
    },
  ];

  return (
    <div className="flex flex-col items-center my-20">
      <h1 className="flex justify-start items-start text-start text-2xl text-white font-serif ">Features</h1>
      <div className="flex justify-center items-center">
        {Icons.map((icon, index) => (
          <motion.div
            key={index}
            className="border shadow-md shadow-neutral-900 text-lime-50 rounded-lg w-60 m-6 "
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 , delay: index * 1 }}
          >
            <div className="flex items-center justify-center gap-x-6 p-6">
              <div className="flex flex-col justify-center items-center h-20">
                <div className="h-20 flex items-center justify-center py-5">
                  {icon.icon}
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">{icon.title}</h2>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UsesOfStudyVerse;
