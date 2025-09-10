import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import LogIn from "../Auth/LogIn";
import { EmailContext } from "../Auth/AuthProviders/EmailContexProvider";
import LandingHome from "../LandingPage/Home";
import Home from "../Main/RouteMenuComponent/Home";
import Menu from "../Main/Menu";
import ProfileDetail from "../Main/RoutesComponents/ProfileDetail";
import ProfileBio from "../Main/RoutesComponents/ProfileBio";
import Profile from "../Main/RouteMenuComponent/Profile";
import Post from "../Main/RouteMenuComponent/Post";
import Notes from "../Main/RouteMenuComponent/Notes";
import Search from "../Main/RouteMenuComponent/Search";
import UserProfile from "../Main/RouteMenuComponent/UserProfile";
import CurrentUserContexProvider from "../Main/RouteMenuComponent/CurrentUserContexProvider";
import Messages from "../Main/RouteMenuComponent/Messages";
import MobileContact from "../Main/RouteMenuComponent/MobileContact";
import Setting from "../Main/RouteMenuComponent/Settings/Setting";

const MenuWrapper = ({ children }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const hideNavbarPaths = ["/login", "/profileBio", "/fillprofile"];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNavBar = !hideNavbarPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-900 w-full pb-16"> {/* Padding for mobile bottom nav */}
        {children}
        {showNavBar && <div className="fixed bottom-0 left-0 right-0 z-30">
          <Menu />
        </div>}
      </div>
    );
  }

  return (
    <div className="h-screen w-full grid grid-cols-[280px_1fr] lg:grid-cols-[310px_1fr]">
      {showNavBar && <Menu />}
      <div className="bg-neutral-900 h-full w-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const PageRoute = () => {
  return (
    <Router>
      <EmailContext>
        <CurrentUserContexProvider>
          <Routes>
            <Route path="/" element={<LandingHome />} />
            <Route path="/login" element={<LogIn />} />
            <Route
              path="/home"
              element={
                <MenuWrapper>
                  <Home />
                </MenuWrapper>
              }
            />
            <Route
              path="/profile"
              element={
                <MenuWrapper>
                  <Profile />
                </MenuWrapper>
              }
            />
            <Route
              path='/messages/:userName'
              element={
                <MenuWrapper>
                  <Messages/>
                </MenuWrapper>
              }
            />
            <Route
              path="/lessons"
              element={
                <MenuWrapper>
                  {/* <Lessons /> */}
                </MenuWrapper>
              }
            />
            <Route
              path="/notes"
              element={
                <MenuWrapper>
                  {/* <Notes /> */}
                </MenuWrapper>
              }
            />
            <Route
              path="/upload"
              element={
                <MenuWrapper>
                  <Post />
                </MenuWrapper>
              }
            />
            <Route
               path="/contactMessage"
               element={
                <MenuWrapper>
                  <MobileContact/>
                </MenuWrapper>
               }
            />
            <Route
              path="/profile/:userName"
              element={
                <MenuWrapper>
                  <UserProfile/>
                </MenuWrapper>
              }
            />
            <Route
              path="/settings"
              element={
                <MenuWrapper>
                  <Setting/>
                </MenuWrapper>
              }
            />
            <Route
              path='/createNotes'
              element={
                <MenuWrapper>
                  <Notes />
                </MenuWrapper>
              }
            />
            <Route path="/fillprofile" element={<ProfileDetail />} />
            <Route path="/profileBio" element={<ProfileBio />} />
            
            {/* 404 Page */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-neutral-400">Page not found</p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </CurrentUserContexProvider>
      </EmailContext>
    </Router>
  );
};

export default PageRoute;