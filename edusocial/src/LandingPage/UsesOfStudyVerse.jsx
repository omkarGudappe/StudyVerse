// import React from "react";
// import { motion } from "framer-motion";

// const UsesOfStudyVerse = () => {
//   const Icons = [
//     {
//       id: 1,
//       icon: (
//         <i className="fa-solid fa-people-group text-4xl bg-purple-600 bg-clip-text text-transparent"></i>
//       ),
//       title: "Community Building",
//     },
//     {
//       id: 2,
//       icon: (
//         <i className="fa-solid fa-play text-4xl bg-cyan-500 bg-clip-text text-transparent"></i>
//       ),
//       title: "Upload and Watch Video Lessons",
//     },
//     {
//       id: 3,
//       icon: (
//         <i className="fa-solid fa-book text-4xl bg-amber-500 bg-clip-text text-transparent"></i>
//       ),
//       title: "Note Creating and Sharing",
//     },
//   ];

//   return (
//     <div className="flex flex-col items-center my-20">
//       <h1 className="flex justify-start items-start text-start text-2xl text-white font-serif ">Features</h1>
//       <div className="flex justify-center items-center">
//         {Icons.map((icon, index) => (
//           <motion.div
//             key={index}
//             className="border shadow-md shadow-neutral-900 text-lime-50 rounded-lg w-60 m-6 "
//             initial={{ opacity: 0, x: -50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.5 , delay: index * 1 }}
//           >
//             <div className="flex items-center justify-center gap-x-6 p-6">
//               <div className="flex flex-col justify-center items-center h-20">
//                 <div className="h-20 flex items-center justify-center py-5">
//                   {icon.icon}
//                 </div>
//                 <h2 className="text-lg font-semibold text-center mb-2">{icon.title}</h2>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default UsesOfStudyVerse;



import React from "react";
import { motion } from "framer-motion";

const UsesOfStudyVerse = () => {
  const features = [
    {
      id: 1,
      icon: (
        <div className="p-6 bg-purple-600/20 rounded-2xl">
          <i className="fa-solid fa-people-group text-5xl text-purple-400"></i>
        </div>
      ),
      title: "Community Building",
      description: "Connect with students worldwide, join study groups, and collaborate on projects in real-time."
    },
    {
      id: 2,
      icon: (
        <div className="p-6 bg-cyan-600/20 rounded-2xl">
          <i className="fa-solid fa-play text-5xl text-cyan-400"></i>
        </div>
      ),
      title: "Video Lessons",
      description: "Upload, share, and discover educational videos. Learn from peers and expert educators."
    },
    {
      id: 3,
      icon: (
        <div className="p-6 bg-amber-600/20 rounded-2xl">
          <i className="fa-solid fa-book text-5xl text-amber-400"></i>
        </div>
      ),
      title: "Note Sharing",
      description: "Create beautiful notes, share them with your network, and collaborate in real-time."
    },
    {
      id: 4,
      icon: (
        <div className="p-6 bg-green-600/20 rounded-2xl">
          <i className="fa-solid fa-message text-5xl text-green-400"></i>
        </div>
      ),
      title: "Messaging",
      description: "Chat with classmates, share resources, and get instant help with your studies."
    },
    {
      id: 5,
      icon: (
        <div className="p-6 bg-pink-600/20 rounded-2xl">
          <i className="fa-solid fa-graduation-cap text-5xl text-pink-400"></i>
        </div>
      ),
      title: "Skill Development",
      description: "Learn new skills, track your progress, and get recognized for your achievements."
    },
    {
      id: 6,
      icon: (
        <div className="p-6 bg-blue-600/20 rounded-2xl">
          <i className="fa-solid fa-calendar text-5xl text-blue-400"></i>
        </div>
      ),
      title: "Study Planning",
      description: "Organize your study schedule, set reminders, and stay on track with your goals."
    }
  ];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-neutral-900">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            StudyVerse brings all your learning tools together in one powerful platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className="group bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-8 border border-neutral-700 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="mb-6 transform group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 p-8 bg-neutral-800/30 rounded-2xl border border-neutral-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">50K+</div>
            <div className="text-neutral-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">100K+</div>
            <div className="text-neutral-400">Study Notes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">25K+</div>
            <div className="text-neutral-400">Video Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">95%</div>
            <div className="text-neutral-400">Satisfaction Rate</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UsesOfStudyVerse;