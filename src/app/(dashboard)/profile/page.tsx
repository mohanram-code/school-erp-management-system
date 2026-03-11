import { auth, currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const ProfilePage = async () => {
  const user = await currentUser();
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User";
  const email = user.emailAddresses[0]?.emailAddress || "No email";
  const profileImage = user.imageUrl;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Profile Information</h1>
          <div className="flex flex-col gap-4">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center gap-4">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{userName}</h2>
                <p className="text-gray-500 capitalize">{role}</p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="font-medium">{email}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Username</p>
                <p className="font-medium">{user.username || "Not set"}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <p className="font-medium capitalize">{role}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">User ID</p>
                <p className="font-medium text-xs break-all">{user.id}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Account Created</p>
                <p className="font-medium">
                  {new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date(user.createdAt))}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Last Sign In</p>
                <p className="font-medium">
                  {user.lastSignInAt
                    ? new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(user.lastSignInAt))
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Quick Actions */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border"
            >
              <Image src="/setting.png" alt="" width={20} height={20} />
              <span>Account Settings</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border"
            >
              <Image src="/home.png" alt="" width={20} height={20} />
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Account Status</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Verified</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Two-Factor Auth</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                Disabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;