import reelsIcon from 'lucide-static/icons/circle-play.svg';
import playIcon from 'lucide-static/icons/play.svg';
import pauseIcon from 'lucide-static/icons/pause.svg';
import volumeIcon from 'lucide-static/icons/volume-2.svg';
import muteIcon from 'lucide-static/icons/volume-x.svg';
import downloadIcon from 'lucide-static/icons/download.svg';
import floatIcon from 'lucide-static/icons/picture-in-picture-2.svg';
import restoreIcon from 'lucide-static/icons/panel-top.svg';
import closeIcon from 'lucide-static/icons/x.svg';
import fullscreenIcon from 'lucide-static/icons/maximize.svg';
import shrinkIcon from 'lucide-static/icons/minimize.svg';
import repliesIcon from 'lucide-static/icons/message-circle.svg';
import externalIcon from 'lucide-static/icons/arrow-up-right.svg';
import qualityIcon from 'lucide-static/icons/chevron-down.svg';
import appearanceIcon from 'lucide-static/icons/settings-2.svg';
import sunIcon from 'lucide-static/icons/sun.svg';
import moonIcon from 'lucide-static/icons/moon.svg';
import systemIcon from 'lucide-static/icons/monitor.svg';
import framingIcon from 'lucide-static/icons/crop.svg';
import sizeIcon from 'lucide-static/icons/move-diagonal-2.svg';
import checkIcon from 'lucide-static/icons/check.svg';
import autoIcon from 'lucide-static/icons/list-end.svg';
import shortcutsIcon from 'lucide-static/icons/keyboard.svg';
import resetIcon from 'lucide-static/icons/rotate-ccw.svg';
import upIcon from 'lucide-static/icons/chevron-up.svg';
import likeIcon from 'lucide-static/icons/heart.svg';
import repostIcon from 'lucide-static/icons/repeat-2.svg';
import bookmarkIcon from 'lucide-static/icons/bookmark.svg';
import shareIcon from 'lucide-static/icons/link-2.svg';
import turtleIcon from 'lucide-static/icons/turtle.svg';
import rabbitIcon from 'lucide-static/icons/rabbit.svg';
import captionsIcon from 'lucide-static/icons/closed-caption.svg';

const icons = {
  reels: reelsIcon,
  play: playIcon,
  pause: pauseIcon,
  volume: volumeIcon,
  mute: muteIcon,
  download: downloadIcon,
  float: floatIcon,
  restore: restoreIcon,
  close: closeIcon,
  fullscreen: fullscreenIcon,
  shrink: shrinkIcon,
  replies: repliesIcon,
  'fullscreen-comments': repliesIcon,
  external: externalIcon,
  quality: qualityIcon,
  appearance: appearanceIcon,
  sun: sunIcon,
  moon: moonIcon,
  system: systemIcon,
  size: sizeIcon,
  framing: framingIcon,
  check: checkIcon,
  auto: autoIcon,
  shortcuts: shortcutsIcon,
  reset: resetIcon,
  up: upIcon,
  down: qualityIcon,
  like: likeIcon,
  repost: repostIcon,
  bookmark: bookmarkIcon,
  share: shareIcon,
  turtle: turtleIcon,
  rabbit: rabbitIcon,
  captions: captionsIcon,
};
export const icon = name => icons[name].slice(icons[name].indexOf('<svg')).replace('<svg', '<svg aria-hidden="true" focusable="false"');
