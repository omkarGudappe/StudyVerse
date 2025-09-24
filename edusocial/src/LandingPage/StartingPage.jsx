import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const StartingPage = () => {
  return (
    <div className="bg-neutral-900 min-h-screen">
      <nav className="flex items-center justify-between h-20 px-4 md:px-12 bg-neutral-800/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b border-neutral-700">
        <Link to="/" className="flex items-center overflow-hidden h-1/2 w-auto">
          <img 
            src="/LOGO/StudyVerseLogo2.png" 
            className="w-40 h-auto" 
            alt="StudyVerse Logo" 
          />
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/login"
            className="text-white hover:bg-blue-600 px-3 py-2 text-sm md:text-base rounded-lg transition-all duration-200"
          >
            Log In
          </Link>
          <Link
            to="/login?signup=true"
            className="text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm md:text-base rounded-lg transition-all duration-200"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen pt-16 pb-10 px-4 sm:mt-10 mt-10 md:px-8 lg:px-16 gap-8 lg:gap-16">
        <motion.div 
          className="flex flex-col gap-6 max-w-2xl text-center lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            A social learning platform where students connect, learn, and grow together.
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-neutral-300 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            StudyVerse is a modern learning social network built for students.
            Discover lessons, create and share notes, post teaching videos, and
            connect with classmates or peers worldwide.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <input 
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white p-3 md:p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-neutral-500"
              placeholder="Enter your email"
            />
            <motion.button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.img 
            src="/Images/Student.png" 
            className="w-80 md:w-96 lg:w-[500px] h-auto drop-shadow-2xl"
            alt="Student studying"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>

      <FeaturesPreview />
    </div>
  );
};

const FeaturesPreview = () => {
  const features = [
    {
      id: 1,
      icon: (
        <div className="p-4 bg-purple-600/20 rounded-2xl">
          <i className="fa-solid fa-people-group text-4xl text-purple-400"></i>
        </div>
      ),
      title: "Community Building",
      description: "Connect with students worldwide and build study groups"
    },
    {
      id: 2,
      icon: (
        <div className="p-4 bg-cyan-600/20 rounded-2xl">
          <i className="fa-solid fa-play text-4xl text-cyan-400"></i>
        </div>
      ),
      title: "Video Lessons",
      description: "Upload and watch educational videos from peers and teachers"
    },
    {
      id: 3,
      icon: (
        <div className="p-4 bg-amber-600/20 rounded-2xl">
          <i className="fa-solid fa-book text-4xl text-amber-400"></i>
        </div>
      ),
      title: "Note Sharing",
      description: "Create, share, and collaborate on study notes in real-time"
    }
  ];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-neutral-800/30">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Why Choose StudyVerse?
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="text-center mt-16 p-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Learning Experience?
          </h3>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Join thousands of students who are already using StudyVerse to make learning social, collaborative, and fun.
          </p>
          <motion.button
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Journey Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default StartingPage;