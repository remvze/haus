import { BiSolidTrain, BiSolidPlaneAlt } from 'react-icons/bi';
import { FaCarSide } from 'react-icons/fa';
import { GiSubmarine, GiSailboat } from 'react-icons/gi';
import { TbSailboat } from 'react-icons/tb';

import type { Category } from '../types';

import { getAssetPath } from '@/helpers/path';

export const transport: Category = {
  icon: <FaCarSide />,
  id: 'transport',
  sounds: [
    {
      icon: <BiSolidTrain />,
      id: 'train',
      label: 'Train',
      src: getAssetPath('/sounds/transport/train.mp3'),
    },
    {
      icon: <BiSolidTrain />,
      id: 'inside-a-train',
      label: 'Inside a Train',
      src: getAssetPath('/sounds/transport/inside-a-train.mp3'),
    },
    {
      icon: <BiSolidPlaneAlt />,
      id: 'airplane',
      label: 'Airplane',
      src: getAssetPath('/sounds/transport/airplane.mp3'),
    },
    {
      icon: <GiSubmarine />,
      id: 'submarine',
      label: 'Submarine',
      src: getAssetPath('/sounds/transport/submarine.mp3'),
    },
    {
      icon: <GiSailboat />,
      id: 'sailboat',
      label: 'Sailboat',
      src: getAssetPath('/sounds/transport/sailboat.mp3'),
    },
    {
      icon: <TbSailboat />,
      id: 'rowing-boat',
      label: 'Rowing Boat',
      src: getAssetPath('/sounds/transport/rowing-boat.mp3'),
    },
  ],
  title: 'Transport',
};
