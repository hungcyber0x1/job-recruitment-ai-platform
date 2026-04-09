import PropTypes from 'prop-types';
import { useState } from 'react';
import { User } from 'lucide-react';
import { AVATAR_SIZES, getIconSizeFromAvatar } from '../../constants/sizes';
import { getInitials } from '../../utils/formatters';

/** Ảnh đại diện: `key={src}` ở ngoài reset trạng thái lỗi tải khi đổi URL (tránh setState trong effect). */
function AvatarImage({ src, name, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  return showImg ? (
    <img
      src={src}
      alt={name || ''}
      className="h-full w-full object-cover"
      onError={() => setImgFailed(true)}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-600">
      {name ? getInitials(name) : <User size={getIconSizeFromAvatar(size)} />}
    </div>
  );
}

AvatarImage.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  return (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden font-bold border-2 border-white shadow-sm ${AVATAR_SIZES[size]} ${className}`}
    >
      <AvatarImage key={src || '__no_src__'} src={src} name={name} size={size} />
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default Avatar;
