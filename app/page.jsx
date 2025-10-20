"use server"
import Dashboard from '@/components/dashboard/Dashboard';
import { customFetch } from '@/api/customFetch';
import { DialerProvider } from '@/app/context/DialerContext';
const Home = async () => {


  // const isLoginCookie = await isLoginCookieValid();
  // console.log("isLoginCookie1", isLoginCookie);
  // if (!isLoginCookie) {
  //   redirect('/login');
  // }

  let contactData = null;
  let extensionData = null;
  let callHistoryData = null;
  let profileData = null;
  let recordingData = null;

  const extensionsResponse = await customFetch("extensions/mobile", "GET");
  // console.log("extensionsResponse", extensionsResponse);
  // if(extensionsResponse.error && extensionsResponse.message === "Unauthorized") {
  //   redirect('/login');
  // }
  // console.log("extensionsResponse", extensionsResponse);
  
  // if(extensionsResponse.error && extensionsResponse.message === "Unauthorized") {
  //   redirect('/login');
  // }
  // console.log("extensionsResponse", extensionsResponse);
  extensionData = extensionsResponse;

  if(extensionData?.[0]?.id) {
    const contactResponse = await customFetch(`extension/${extensionData?.[0]?.id}/contacts`, "GET");
    contactData = contactResponse;

    const callHistoryResponse = await customFetch(`extension/${extensionData?.[0]?.id}/calls?limit=10`, "GET");
    callHistoryData = callHistoryResponse;

    const profileResponse = await customFetch(`me`, "GET");
    profileData = profileResponse;
    const recordingResponse = await customFetch(`extension/${extensionData?.[0]?.id}/records`, "GET");
    recordingData = recordingResponse;
    // console.log("recordingData", recordingData);
  }
  // console.log("contactData", con/tactData);
  // let contactData = null;
  return (
    <DialerProvider extensionData={extensionData} contactData={contactData} callHistoryData={callHistoryData} profileData={profileData} recordingData={recordingData}>
      <Dashboard />
    </DialerProvider>
  );
}

export default Home;