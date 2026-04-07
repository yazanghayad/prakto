'use client';

/**
 * Client-side hook for filtering navigation items based on user role.
 *
 * Uses the custom useUser() hook (Appwrite) to check the current user's role.
 * Items with access.roles are only shown if the user's role is included.
 * Items without access restrictions are shown to all authenticated users.
 *
 * This is for UI visibility only — actual security is enforced server-side
 * via Appwrite document permissions and Functions.
 */

import { useMemo } from 'react';
import { useUser } from '@/hooks/use-auth';
import type { NavItem, NavGroup } from '@/types';

/**
 * Filter a flat list of nav items by the current user's role.
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { role } = useUser();

  return useMemo(() => {
    return items
      .filter((item) => {
        if (!item.access?.roles) return true;
        if (!role) return false;
        return item.access.roles.includes(role);
      })
      .map((item) => {
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((child) => {
            if (!child.access?.roles) return true;
            if (!role) return false;
            return child.access.roles.includes(role);
          });
          return { ...item, items: filteredChildren };
        }
        return item;
      });
  }, [items, role]);
}

/**
 * Filter navigation groups, removing empty groups after item filtering.
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
