'use client';

import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  BarChart3,
  Bird,
  Cat,
  Check,
  Dog,
  Filter,
  Fish,
  Headphones,
  Heart,
  Home,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageCircle,
  PawPrint,
  Rabbit,
  Rat,
  Send,
  Trash2,
  Turtle,
  User,
  X,
} from 'lucide-react';

export type UserIconName =
  | 'bird'
  | 'cat'
  | 'chat'
  | 'check'
  | 'cross'
  | 'dog'
  | 'dog-leashed'
  | 'exit'
  | 'filter'
  | 'fish'
  | 'hamster'
  | 'headset'
  | 'heart'
  | 'home'
  | 'menu'
  | 'paw'
  | 'picture'
  | 'rabbit'
  | 'send'
  | 'stats'
  | 'trash'
  | 'turtle'
  | 'user';

/** Единый набор иконок Lucide — вместо кастомного набора из ember-atlas. */
const ICONS: Record<UserIconName, LucideIcon> = {
  bird: Bird,
  cat: Cat,
  chat: MessageCircle,
  check: Check,
  cross: X,
  dog: Dog,
  'dog-leashed': Dog,
  exit: LogOut,
  filter: Filter,
  fish: Fish,
  hamster: Rat,
  headset: Headphones,
  heart: Heart,
  home: Home,
  menu: Menu,
  paw: PawPrint,
  picture: ImageIcon,
  rabbit: Rabbit,
  send: Send,
  stats: BarChart3,
  trash: Trash2,
  turtle: Turtle,
  user: User,
};

interface UserIconProps extends Omit<LucideProps, 'ref'> {
  name: UserIconName;
}

export default function UserIcon({ name, strokeWidth = 1.75, ...props }: UserIconProps) {
  const Icon = ICONS[name];
  return <Icon strokeWidth={strokeWidth} {...props} aria-hidden="true" focusable="false" />;
}
