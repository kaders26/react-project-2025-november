import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";

type ProfileCardProps = {
  profile: UserInstance;
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const getRoleDisplay = (): string => {
    if (profile?.role) {
      if (typeof profile.role === 'object' && profile.role !== null) {
        return profile.role.name || String(profile.role.id) || 'N/A';
      }
      return String(profile.role);
    }
    
    const localStorageRole = AuthSession.getRoles();
    return localStorageRole ? String(localStorageRole) : 'N/A';
  };

  // İsimden baş harfleri al
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = profile?.name || AuthSession.getName() || 'User';
  const userEmail = profile?.email || AuthSession.getEmail() || 'N/A';
  const userRole = getRoleDisplay();

  return (
    <div className="profile-section">
      {/* Avatar */}
      <div className="profile-avatar">
        {profile?.avatar ? (
          <img src={profile.avatar} alt={userName} />
        ) : (
          <span>{getInitials(userName)}</span>
        )}
      </div>

      {/* Bilgiler */}
      <div className="profile-info">
        <h2>Welcome, {userName}</h2>
        <p className="profile-email">
          <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
          </svg>
          {userEmail}
        </p>
        <div className="role-badge">{userRole}</div>
      </div>
    </div>
  );
};

export default ProfileCard;