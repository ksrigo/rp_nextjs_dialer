"use server"
import Dashboard from '@/components/dashboard/Dashboard';
import { fetchDashboard } from '@/services/dashboard';
import { DialerProvider } from '@/app/context/DialerContext';
import PermissionsGate from '@/components/shared/PermissionsGate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
const Home = async () => {

  const session = await getServerSession(authOptions);
  if (!session || session?.error) {
    redirect('/login');
  }

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

  // const extensionsResponse = await customFetch("extensions/mobile", "GET");
  const initialData = await fetchDashboard();
  // console.log("initialData", initialData);
  // console.log("extensionsResponse", extensionsResponse);
  // if(extensionsResponse.error && extensionsResponse.message === "Unauthorized") {
  //   redirect('/login');
  // }
  // console.log("extensionsResponse", extensionsResponse);
  
  // if(extensionsResponse.error && extensionsResponse.message === "Unauthorized") {
  //   redirect('/login');
  // }
  // console.log("extensionsResponse", extensionsResponse);

  if(initialData.success) {
    extensionData = initialData.data.extensionData;
    contactData = initialData.data.contactData;
    callHistoryData = initialData.data.callHistoryData;
    profileData = initialData.data.profileData;
    recordingData = initialData.data.recordingData;
  }
  // console.log("extensionData", extensionData);
  // console.log("contactData", contactData);
  // console.log("callHistoryData", callHistoryData);
  // console.log("profileData", profileData);
  // console.log("recordingData", recordingData);
  // console.log("contactData", con/tactData);
  // let contactData = null;
  return (
    <DialerProvider extensionData={extensionData} contactData={contactData} callHistoryData={callHistoryData} profileData={profileData} recordingData={recordingData}>
      <PermissionsGate enabled={!!initialData?.success} />
      <Dashboard />
    </DialerProvider>
  );
}

export default Home;