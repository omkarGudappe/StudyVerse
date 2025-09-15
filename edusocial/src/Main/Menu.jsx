import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Post from './RouteMenuComponent/Post';
import { motion, AnimatePresence } from 'framer-motion';
import Search from "./RouteMenuComponent/Search";
import { UserDataContextExport } from "../Main/RouteMenuComponent/CurrentUserContexProvider";
import Notification from "./RouteMenuComponent/Notification";
import MessageContact from "./RouteMenuComponent/MessageContact";
import UsersNotes from "./RouteMenuComponent/UsersNotes";
import Socket from '../SocketConnection/Socket';

const Menu = () => {
  const [activeBtn, setActiveBtn] = useState("home");
  const [showPost, setShowPost] = useState(false);
  const [searchClicked, setSearchClicked] = useState(false);
  const { ProfileData } = UserDataContextExport();
  const [NotificationOpen, setOpenNotification] = useState(false);
  const [MessageContactClick, setMessageContactClick] = useState(false);
  const [IsMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [OpenUserNotes, setOpenUserNotes] = useState(false);
  const location = useLocation();
  const [NotificationLength, setNotificationsLenght] = useState();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [])

  // Sync activeBtn with current route
  useEffect(() => {
    const path = location.pathname.substring(1); // Remove leading slash
    const validMenuItems = [
      "home", "search", "upload", "createNotes", "notification", 
      "messages", "profile", "lessons", "notes", "settings"
    ];
    
    if (validMenuItems.includes(path)) {
      setActiveBtn(path);
    } else if (path === "") {
      setActiveBtn("home");
    }
  }, [location.pathname]);

  useEffect(() => {
    if(!ProfileData) return;
    const Id = ProfileData?._id;
    if(ProfileData?.Uid){
      console.log(Id);
      Socket.emit("registerUser",{userId: Id});
    }
    
  }, [ProfileData])
  
  useEffect(() => {
    Socket.on("Length", ({ Length }) => {
      setNotificationsLenght(Length);
    })
    return () => Socket.off("Length");
  }, [])

  const mainMenuItems = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="" viewBox="0 0 640 640" fill="currentColor">
          <path d="M298.2 72.6C310.5 61.2 329.5 61.2 341.7 72.6L432 156.3L432 144C432 126.3 446.3 112 464 112L496 112C513.7 112 528 126.3 528 144L528 245.5L565.8 280.6C575.4 289.6 578.6 303.5 573.8 315.7C569 327.9 557.2 336 544 336L528 336L528 512C528 547.3 499.3 576 464 576L176 576C140.7 576 112 547.3 112 512L112 336L96 336C82.8 336 71 327.9 66.2 315.7C61.4 303.5 64.6 289.5 74.2 280.6L298.2 72.6zM304 384C277.5 384 256 405.5 256 432L256 528L384 528L384 432C384 405.5 362.5 384 336 384L304 384z" />
        </svg>
      )
    },
    {
      id: "search",
      label: "Search",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      ),
      action: () => setSearchClicked(!searchClicked)
    },
    {
      id: "upload",
      label: "Upload",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      action: () => setShowPost(true)
    },
    {
      id: "createNotes",
      label: "Notes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6" viewBox="0 0 24 24" 
          width="28" height="28" fill="none" stroke="currentColor" 
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          aria-label="Notes">
        <rect x="4" y="3" width="16" height="18" rx="2" ry="2"/>
        <line x1="8" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="16" x2="13" y2="16"/>
      </svg>
      )
    },
    {
      id: "notification",
      label: "Notifications",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6" viewBox="0 0 24 24"
            width="28" height="28" fill="none" stroke="currentColor"
            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
            aria-label="Notification">
          <path d="M12 3c-3 0-5 2-5 5v3c0 .8-.3 1.6-.8 2.2L5 15v2h14v-2l-1.2-1.8c-.5-.6-.8-1.4-.8-2.2V8c0-3-2-5-5-5z"/>
          <path d="M8 17h8"/>
          <circle cx="12" cy="19" r="1.6"/>
        </svg>
      ),
      action: () => setOpenNotification(!NotificationOpen),
    },
    {
      id: "messages",
      label: "Messages",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      action: () => setMessageContactClick(!MessageContactClick),
    },
    {
      id: "profile",
      label: "Profile",
      icon: ProfileData && ProfileData?.UserProfile?.avatar?.url ? (
        <div className="h-7 w-7 rounded-full overflow-hidden">
          <img src={ProfileData?.UserProfile?.avatar?.url} className="object-cover h-7 w-7" alt="" />
        </div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      ),
    },
    {
      id: 'contactMessage',
      label: "Messages",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  const desktopOnlyItems = [
    {
      id: "lessons",
      label: "Watch Lessons",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
          <path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM252.3 211.1C244.7 215.3 240 223.4 240 232L240 408C240 416.7 244.7 424.7 252.3 428.9C259.9 433.1 269.1 433 276.6 428.4L420.6 340.4C427.7 336 432.1 328.3 432.1 319.9C432.1 311.5 427.7 303.8 420.6 299.4L276.6 211.4C269.2 206.9 259.9 206.7 252.3 210.9z" />
        </svg>
      )
    },
    {
      id: "notes",
      label: "Notes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M12 3v6l2-1 2 1V3" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      ),
      action: () => setOpenUserNotes(!OpenUserNotes),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
          <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
        </svg>
      )
    }
  ];

  const OnlyMobileMenu = [
    {
      id:"notes",
      label: "My Notes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M12 3v6l2-1 2 1V3" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      ),
    }
  ]

  const handleMenuItemClick = (itemId, action) => {
    setActiveBtn(itemId);
    if (action) {
      action();
    }
  };

  const mobileMenuItems = [
    mainMenuItems.find(item => item.id === "home"),
    mainMenuItems.find(item => item.id === "createNotes"),
    mainMenuItems.find(item => item.id === "contactMessage"),
    { id: "more", label: "More", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    )},
    mainMenuItems.find(item => item.id === "profile")
  ].filter(Boolean);

  const moreMenuItems = [
    mainMenuItems.find(item => item.id === "search"),
    desktopOnlyItems.find(item => item.id === "lessons"),
    desktopOnlyItems.find(item => item.id === "settings"),
    OnlyMobileMenu.find(item => item.id === 'notes'),
  ].filter(Boolean);

  const getRoutePath = (itemId) => {
    const nonRouteItems = ["upload", "search", "notification" , "messages" , "notes"];
    return nonRouteItems.includes(itemId) ? "#" : `/${itemId}`;
  };

  const IsShowOrNot = () => {
     const path = location.pathname.substring(1);
    const current = ["settings" , "notes", "profile" , "search", "createNotes" , "notification", "profile" , "messages" , "contactMessage",];

    const dynamicRoutes = ["messages"];

    if (current.includes(path)) {
      return "hidden";
    }

    for (const route of dynamicRoutes) {
      if (path.startsWith(route + "/")) {
        return "hidden";
      }
    }
    return "";
  }

  const LargScreen = mainMenuItems.filter((item) => item.id !== 'contactMessage')

  return (
    <>
      <Search searchClicked={searchClicked} onClose={() => setSearchClicked(!searchClicked)} />
      <Notification open={NotificationOpen} onClose={() => setOpenNotification(!NotificationOpen)} ProfileData={ProfileData} />
      <MessageContact open={MessageContactClick} onClose={() => setMessageContactClick(false)} />
      <UsersNotes open={OpenUserNotes} onClose={() => setOpenUserNotes(!OpenUserNotes)} ProfileData={ProfileData} from="desktop" />

      <motion.div 
        className="hidden z-50 md:flex h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 border-r border-neutral-700 sticky top-0 flex-col"
        animate={{ width: searchClicked ? 80 : NotificationOpen ? 80 : MessageContactClick ? 80 : OpenUserNotes ? 80 : 320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
          className="flex items-center p-6 border-b border-neutral-700"
          animate={{ justifyContent: searchClicked ? "center" : NotificationOpen ? "center" : MessageContactClick ? "center" : OpenUserNotes ? "center" : "flex-start" }}
          transition={{ duration: 0.2 }}
        >
          <img
            src="/LOGO/StudyVerseIcon.png"
            alt="Study Verse Logo"
            className="w-12 h-12"
          />
          <AnimatePresence>
            {!searchClicked && !NotificationOpen && !MessageContactClick && !OpenUserNotes && (
              <motion.h1 
                className="text-white text-2xl font-bold ml-3 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                StudyVerse
              </motion.h1>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex-1 lenis overflow-y-auto scroll-smooth scroll- py-6">
          <div className="space-y-2 px-4">
            {LargScreen.map((item) => (
              <div className={`${item.id === 'notification' ? 'relative' : ''}`}>
                <Link
                  key={item?.id}
                  to={getRoutePath(item.id)}
                  onClick={() => handleMenuItemClick(item.id, item.action)}
                  className={`flex items-center cursor-pointer gap-4 p-4 rounded-xl transition-all duration-300 ${
                    activeBtn === item.id
                      ? "bg-purple-600/20 border border-purple-500/30 text-purple-400 shadow-lg"
                      : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
                  } ${searchClicked || NotificationOpen || MessageContactClick || OpenUserNotes ? 'justify-center' :  ''}`}
                >
                  <div className={`${searchClicked || NotificationOpen || MessageContactClick || OpenUserNotes ? "w-10 h-5 text-center" : "w-6 h-6 text-center"} flex items-center justify-center ${activeBtn === item.id ? "text-purple-400" : "text-neutral-400"}`}>
                    <span className={`${searchClicked || NotificationOpen || MessageContactClick || OpenUserNotes ? "w-6 text-center" : 'w-7 text-center'}`}>{item.icon}</span>
                  </div>
                  <AnimatePresence>
                    {!searchClicked && !NotificationOpen && !MessageContactClick && !OpenUserNotes && (
                      <motion.span 
                        className="font-medium"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                { NotificationLength > 0 && ( 
                  <div className={`${item.id === 'notification' ? 'absolute' : 'hidden' } text-white h-5 w-5 rounded-full bg-red-600 top-0 right-0 flex items-center justify-center`}>
                    <span className="text-sm">{NotificationLength}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-700">
          <div className="space-y-2">
            {desktopOnlyItems.map((item) => (
                 <Link
                  key={item.id}
                  to={getRoutePath(item.id)}
                  onClick={() => handleMenuItemClick(item.id, item.action)}
                  className={`flex items-center gap-4 p-4 cursor-pointer rounded-xl transition-all duration-300 ${
                    activeBtn === item.id
                      ? "bg-purple-600/20 border border-purple-500/30 text-purple-400 shadow-lg"
                      : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
                  } ${searchClicked || OpenUserNotes ? 'justify-center' : ''}`}
                >
                  <div className={`${searchClicked ? "w-10 h-5 text-center" : "w-6 h-6 text-center"} flex items-center justify-center ${activeBtn === item.id ? "text-purple-400" : "text-neutral-400"}`}>
                    <span className={`${searchClicked ? "w-6 text-center" : 'w-7 text-center'}`}>{item.icon}</span>
                  </div>
                  <AnimatePresence>
                    {!searchClicked && !NotificationOpen && !MessageContactClick && !OpenUserNotes && (
                      <motion.span 
                      className="font-medium"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="md:hidden">
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setOpenNotification(!NotificationOpen)}
            className={`p-2 relative cursor-pointer rounded-full bg-neutral-800/80 backdrop-blur-sm z-20 text-neutral-300 hover:text-white transition-colors ${IsShowOrNot()}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" 
                strokeLinejoin="round" aria-label="Notification">
              <path d="M12 3c-3 0-5 2-5 5v3c0 .8-.3 1.6-.8 2.2L5 15v2h14v-2l-1.2-1.8c-.5-.6-.8-1.4-.8-2.2V8c0-3-2-5-5-5z"/>
              <path d="M8 17h8"/>
              <circle cx="12" cy="19" r="1.6"/>
            </svg>
           { NotificationLength > 0 && ( 
            <div className="absolute h-4 w-4 rounded-full bg-red-600 top-0 right-0 flex items-center justify-center">
              <span className="text-sm">{NotificationLength}</span>
            </div>)}
          </button>
        </div>

        <div className="fixed right-4 bottom-20 z-40">
          <button
            onClick={() => setShowPost(true)}
            className={`p-4 rounded-full cursor-pointer bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${IsShowOrNot()} `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t rounded-tl-2xl rounded-tr-2xl border-neutral-700 z-50 shadow-2xl">
          <div className="grid grid-cols-5 gap-1 pt-2 pb-3">
            {mobileMenuItems.map((item) => (
              <Link
                key={item.id}
                to={item.id === "more" || item.id === "upload" ? "#" : `/${item.id}`}
                onClick={() => {
                  if (item.id === "more") {
                    setShowMoreMenu(!showMoreMenu);
                  } else {
                    handleMenuItemClick(item.id, item.action);
                  }
                }}
                className={`flex flex-col cursor-pointer justify-center items-center transition-all duration-200 ${
                  activeBtn === item.id
                    ? "text-purple-400"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-7 h-7 mb-1 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-center">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {showMoreMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-1/7 left-2 right-0 z-50 w-20 bg-neutral-900 rounded-3xl border-t border-neutral-700 p-4"
              >
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-1 bg-neutral-700 rounded-full"></div>
                </div>
                
                
                <div className="flex flex-col gap-3">
                  {moreMenuItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col items-center"
                    >
                      <Link
                        to={item.id !== "upload" ? item.id !== "search" ? item.id !== "notification" ? item.id !== 'messages' ? `/${item.id}` : '#' : "#" : "#" : '#'}
                        onClick={() => {handleMenuItemClick(item.id, item.action); setShowMoreMenu(false);}}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-neutral-800/80 text-neutral-300 hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
                      >
                        <div className="w-6 h-6">
                          {item.icon}
                        </div>
                      </Link>
                      <span className="text-xs text-neutral-400 mt-2 text-center">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {showPost && <Post ModelCloseClicked={() => setShowPost(false)} />}
    </>
  );
};

export default Menu;