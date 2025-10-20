"use client";

import SideBar from "@/components/shared/SideBar";
import DialerSidebar from "@/components/dashboard/DialerSideBar";
import CallDetails from "@/components/call-history/CallDetails";

const Dashboard = () => {
    // const [startCall, setStartCall] = useState(false);
    // const [activeTap, setActiveTap] = useState(1);
    // const [phoneNumber, setPhoneNumber] = useState('');

    // const { dialerData, contactData, callHistoryData, profileData } = useDialer();
    // const [profileData, setProfileData] = useState(intialProfileData);
    // useEffect(() => {
    //     const getUser = async () => {
    //         const {accessToken} = await getUserActiveCookie();
    //         console.log('accessToken', accessToken);
    //         if(accessToken !== null && accessToken !== undefined && accessToken !== '') {
    //             setUser({ accessToken });
    //         }
    //         else {
    //             router.push('/login');
    //         }
    //     }
    //     getUser();
    // }, []);

    // useEffect(() => {
    //     const user = getUserActiveCookie();
    //     if(user) {
    //         refreshUserActiveCookies();
    //     }
    // }, []);

    return (
        <div className="layout-wrapper d-lg-flex" style={{ width: "100%" }}>
            <SideBar />
            <DialerSidebar  />
            <CallDetails  />
        </div>
    );
}

export default Dashboard;