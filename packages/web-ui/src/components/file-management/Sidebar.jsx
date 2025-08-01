import React from 'react';
import { 
  HomeIcon,
  ComputerDesktopIcon,
  FolderIcon,
  ClockIcon,
  StarIcon,
  CloudIcon,
  UserGroupIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const Sidebar = ({ 
  currentPath,
  drives,
  favorites,
  recentFiles,
  onNavigate,
  onToggleFavorite,
  isCollapsed = false
}) => {
  const isCurrentPath = (path) => currentPath === path;

  const isFavorite = (path) => {
    return favorites.some(fav => fav.path === path);
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="홈"
        >
          <HomeIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => onNavigate('/desktop')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="바탕화면"
        >
          <ComputerDesktopIcon className="w-6 h-6" />
        </button>
        <button
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="즐겨찾기"
        >
          <StarIcon className="w-6 h-6" />
        </button>
        <button
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="최근 파일"
        >
          <ClockIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 빠른 접근 */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          빠른 접근
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isCurrentPath('/') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
            }`}
          >
            <HomeIcon className="w-5 h-5 mr-3" />
            홈
          </button>
          <button
            onClick={() => onNavigate('/desktop')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isCurrentPath('/desktop') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
            }`}
          >
            <ComputerDesktopIcon className="w-5 h-5 mr-3" />
            바탕화면
          </button>
          <button
            onClick={() => onNavigate('/documents')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isCurrentPath('/documents') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
            }`}
          >
            <FolderIcon className="w-5 h-5 mr-3" />
            문서
          </button>
        </div>
      </div>

      {/* 드라이브 */}
      {drives.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            드라이브
          </h3>
          <div className="space-y-1">
            {drives.map((drive) => (
              <button
                key={drive.path}
                onClick={() => onNavigate(drive.path)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isCurrentPath(drive.path) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                }`}
              >
                <ComputerDesktopIcon className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">{drive.name}</span>
                <span className="text-xs text-gray-500">
                  {drive.freeSpace && `${Math.round(drive.freeSpace / 1024 / 1024 / 1024)}GB`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 즐겨찾기 */}
      {favorites.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            즐겨찾기
          </h3>
          <div className="space-y-1">
            {favorites.map((favorite) => (
              <button
                key={favorite.path}
                onClick={() => onNavigate(favorite.path)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isCurrentPath(favorite.path) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                }`}
              >
                <FolderOpenIcon className="w-5 h-5 mr-3 text-yellow-500" />
                <span className="flex-1 text-left truncate">{favorite.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(favorite);
                  }}
                  className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                >
                  <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최근 파일 */}
      {recentFiles.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-1 overflow-auto">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            최근 파일
          </h3>
          <div className="space-y-1">
            {recentFiles.slice(0, 10).map((file) => (
              <button
                key={file.path}
                onClick={() => onNavigate(file.path)}
                className="w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ClockIcon className="w-5 h-5 mr-3 text-gray-400" />
                <span className="flex-1 text-left truncate text-xs">{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 클라우드 서비스 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          클라우드
        </h3>
        <div className="space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloudIcon className="w-5 h-5 mr-3 text-blue-500" />
            OneDrive
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloudIcon className="w-5 h-5 mr-3 text-green-500" />
            Google Drive
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;