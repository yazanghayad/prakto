import { NavGroup } from '@/types';

/**
 * Navigation configuration for Prakto
 *
 * RBAC: Each item can have an `access.roles` array limiting visibility to specific roles.
 * Items without `access` are visible to all authenticated users.
 * Filtering is done client-side in `use-nav.ts` — for UX only, not security.
 *
 * Roles: student, company, education_manager, admin
 */
export const navGroups: NavGroup[] = [
  // ─── Shared: visible to all roles ───
  {
    label: 'Översikt',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        isActive: false,
        shortcut: ['k', 'b'],
        items: []
      }
    ]
  },

  // ─── Student ───
  {
    label: 'Student',
    items: [
      {
        title: 'Praktikplatser',
        url: '/dashboard/internships',
        icon: 'briefcase',
        shortcut: ['p', 'p'],
        isActive: false,
        items: [],
        access: { roles: ['student', 'education_manager'] }
      },
      {
        title: 'Mina ansökningar',
        url: '/dashboard/applications',
        icon: 'applications',
        shortcut: ['a', 'a'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Sparade',
        url: '/dashboard/saved',
        icon: 'bookmark',
        shortcut: ['s', 's'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Resurser',
        url: '/dashboard/resources',
        icon: 'bulb',
        shortcut: ['r', 'r'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Portfolio',
        url: '/dashboard/portfolio',
        icon: 'portfolio',
        shortcut: ['o', 'o'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Kalender',
        url: '/dashboard/calendar',
        icon: 'calendar',
        shortcut: ['k', 'k'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'AI-verktyg',
        url: '/dashboard/ai-tools',
        icon: 'sparkles',
        shortcut: ['a', 'i'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Journal',
        url: '/dashboard/journal',
        icon: 'notebook',
        shortcut: ['l', 'j'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      },
      {
        title: 'Inkorg',
        url: '/dashboard/inbox',
        icon: 'inbox',
        shortcut: ['i', 'i'],
        isActive: false,
        items: [],
        access: { roles: ['student'] }
      }
    ]
  },

  // ─── Company ───
  {
    label: 'Företag',
    items: [
      {
        title: 'Inkorg',
        url: '/dashboard/inbox',
        icon: 'inbox',
        shortcut: ['i', 'i'],
        isActive: false,
        items: [],
        access: { roles: ['company'] }
      },
      {
        title: 'Mina annonser',
        url: '/dashboard/listings',
        icon: 'briefcase',
        shortcut: ['l', 'l'],
        isActive: false,
        items: [],
        access: { roles: ['company'] }
      },
      {
        title: 'Ansökningar',
        url: '/dashboard/company-applications',
        icon: 'applications',
        isActive: false,
        items: [],
        access: { roles: ['company'] }
      },
      {
        title: 'Kalender',
        url: '/dashboard/calendar',
        icon: 'calendar',
        isActive: false,
        items: [],
        access: { roles: ['company'] }
      }
    ]
  },

  // ─── Education Manager ───
  {
    label: 'Utbildning',
    items: [
      {
        title: 'Studenter',
        url: '/dashboard/students',
        icon: 'school',
        shortcut: ['s', 's'],
        isActive: false,
        items: [],
        access: { roles: ['education_manager'] }
      }
    ]
  },

  // ─── Admin ───
  {
    label: 'Administration',
    items: [
      {
        title: 'Användare',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: [],
        access: { roles: ['admin'] }
      },
      {
        title: 'Företag',
        url: '/dashboard/companies',
        icon: 'building',
        isActive: false,
        items: [],
        access: { roles: ['admin'] }
      },
      {
        title: 'Alla annonser',
        url: '/dashboard/admin/internships',
        icon: 'briefcase',
        isActive: false,
        items: [],
        access: { roles: ['admin'] }
      },
      {
        title: 'Statistik',
        url: '/dashboard/statistics',
        icon: 'statistics',
        isActive: false,
        items: [],
        access: { roles: ['admin'] }
      }
    ]
  },

  // ─── Account: visible to all ───
  {
    label: '',
    items: [
      {
        title: 'Support',
        url: '/dashboard/support',
        icon: 'help',
        isActive: false,
        shortcut: ['h', 'h'],
        items: []
      },
      {
        title: 'Konto',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Profil',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Inställningar',
            url: '/dashboard/settings',
            icon: 'settings',
            shortcut: ['i', 's']
          },
          {
            title: 'Notifikationer',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          }
        ]
      }
    ]
  }
];
