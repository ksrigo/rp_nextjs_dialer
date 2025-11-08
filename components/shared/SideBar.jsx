import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDialer } from "@/app/context/DialerContext";
import Link from "next/link";
import { signOut } from "next-auth/react";

const SideBar = () => {
    const [theme, setTheme] = useState('light');
    const router = useRouter();

    const { activeTap, setActiveTap } = useDialer();

    useEffect(() => {
      // Get initial theme from localStorage or system preference
      const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(savedTheme);
    }, []);
  
    useEffect(() => {
      // Update body attribute and save to localStorage
      document.body.setAttribute('data-bs-theme', theme);
      localStorage.setItem('theme', theme);
    }, [theme]);
  
    const toggleTheme = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = async () => {
       await signOut({ redirect: true, callbackUrl: '/login' });
    }

    
    return (
        <div className="side-menu flex-lg-column me-lg-1 ms-lg-0" >
            <div className="navbar-brand-box">
                <Link href="/" className="logo logo-dark">
                    <span className="logo-sm">
                        <img src="assets/images/logo.webp" alt="" height="30" />
                    </span>
                </Link>

                <Link href="/" className="logo logo-light">
                    <span className="logo-sm">
                        <img src="assets/images/logo.webp" alt="" height="30" />
                    </span>
                </Link>
            </div>

            <div className="flex-lg-column my-auto">
                <ul className="nav nav-pills side-menu-nav justify-content-center" role="tablist">

                    <li className="nav-item" data-bs-placement="top" aria-label="Dialer" data-bs-original-title="Dialer" role="presentation" onClick={() => setActiveTap(1)}>
                        <a className={`nav-link ${activeTap === 1 ? 'active' : ''}`} id="pills-groups-tab" data-bs-toggle="pill" href="#pills-groups" role="tab" aria-selected="true">
                            <i className="ri-phone-line"></i>
                        </a>
                    </li>


                    <li className="nav-item" data-bs-placement="top" aria-label="Contacts" data-bs-original-title="Contacts" role="presentation" onClick={() => setActiveTap(2)}>
                        <a className={`nav-link ${activeTap === 2 ? 'active' : ''}`} id="pills-contacts-tab" data-bs-toggle="pill" href="#pills-contacts" role="tab" aria-selected="false" tabIndex="-1">
                            <i className="ri-contacts-line"></i>
                        </a>
                    </li>
                    <li className="nav-item" data-bs-placement="top" aria-label="Chatss" data-bs-original-title="Chatss" role="presentation" onClick={() => setActiveTap(3)}>
                        <a className={`nav-link ${activeTap === 3 ? 'active' : ''}`} id="pills-chat-tab1" data-bs-toggle="pill1" href="#" role="tab" aria-selected="false" tabIndex="-1">
                            <i className="ri-message-3-line"></i>
                        </a>
                    </li>
                    <li className="nav-item" data-bs-placement="top" aria-label="Profile" data-bs-original-title="Profile" role="presentation" onClick={() => setActiveTap(8)}>
                        <a className={`nav-link ${activeTap === 8 ? 'active' : ''}`} id="pills-profile-tab" data-bs-toggle="pill" href="#pills-profile" role="tab" aria-selected="false" tabIndex="-1">
                            <i className="ri-user-line"></i>
                        </a>
                    </li>
                    {/* <li className="nav-item" data-bs-placement="top" aria-label="Settings" data-bs-original-title="Settings" role="presentation" onClick={() => setActiveTap(4)}>
                        <a className={`nav-link ${activeTap === 4 ? 'active' : ''}`} id="pills-setting-tab" data-bs-toggle="pill" href="#pills-setting" role="tab" aria-selected="false" tabIndex="-1">
                            <i className="ri-settings-2-line"></i>
                        </a>
                    </li> */}
                    <li className="nav-item dropdown profile-user-dropdown d-inline-block d-lg-none">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <img src="assets/images/users/avatar-1.jpg" alt="" className="profile-user rounded-circle" />
                        </a>
                        <div className="dropdown-menu">
                            {/* <a className="dropdown-item" href="#">Profile <i className="ri-profile-line float-end text-muted"></i></a>
                            <a className="dropdown-item" href="#">Setting <i className="ri-settings-3-line float-end text-muted"></i></a>
                            <div className="dropdown-divider"></div> */}
                            <a className="dropdown-item" href="#">Log out <i className="ri-logout-circle-r-line float-end text-muted"></i></a>
                        </div>
                    </li>
                </ul>
            </div>

            <div className="flex-lg-column  d-lg-block">
                <ul className="nav side-menu-nav justify-content-center">
                    <li className="nav-item">
                        <a className="nav-link light-dark-mode" href="#"  onClick={toggleTheme}  
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            <i className="ri-sun-line theme-mode-icon"></i>
                        </a>
                    </li>

                    <li className="nav-item btn-group dropup profile-user-dropdown">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <img src="assets/images/users/avatar-1.jpg" alt="" className="profile-user rounded-circle" />
                        </a>
                        <div className="dropdown-menu">
                            {/* <a className="dropdown-item" href="#">Profile <i className="ri-profile-line float-end text-muted"></i></a>
                            <a className="dropdown-item" href="#">Setting <i className="ri-settings-3-line float-end text-muted"></i></a> */}
                            {/* <div className="dropdown-divider"></div> */}
                            <a className="dropdown-item" href="#" onClick={handleLogout}>Log out <i className="ri-logout-circle-r-line float-end text-muted"></i></a>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default SideBar;