export const SEED_DATA = {
  users: [
    {
      _id: 'user-platform-admin',
      firstName: 'Platform',
      lastName: 'Administrator',
      username: 'admin',
      email: 'admin@hometownhub.local',
      password: 'admin123',
      passwordHash: 'admin123',
      phoneNumber: '+1-555-0100',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Global Platform Administrator for Hometown Hub.',
      hometown: 'Chennai, Tamil Nadu, India',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'public'
      },
      platformRole: 'platformAdmin',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: 'user-arun-admin',
      firstName: 'Arun',
      lastName: 'Kumar',
      username: 'arunkumar',
      email: 'arun@besantnagar.local',
      password: 'arun123',
      passwordHash: 'arun123',
      phoneNumber: '+91-98400-11223',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Lifelong Besant Nagar resident, heritage walker, and community volunteer.',
      hometown: 'Besant Nagar, Chennai, India',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-05T08:30:00.000Z',
      updatedAt: '2026-01-05T08:30:00.000Z'
    },
    {
      _id: 'user-priya-admin',
      firstName: 'Priya',
      lastName: 'Sundaram',
      username: 'priya_s',
      email: 'priya@besantnagar.local',
      password: 'priya123',
      passwordHash: 'priya123',
      phoneNumber: '+91-98400-44556',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'Architect, environmental advocate, and co-admin for Besant Nagar community.',
      hometown: 'Besant Nagar, Chennai, India',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-06T10:15:00.000Z',
      updatedAt: '2026-01-06T10:15:00.000Z'
    },
    {
      _id: 'user-karthik-mod',
      firstName: 'Karthik',
      lastName: 'Raman',
      username: 'karthik_r',
      email: 'karthik@besantnagar.local',
      password: 'karthik123',
      passwordHash: 'karthik123',
      phoneNumber: '+91-98400-77889',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Software engineer and local sports club organizer. Community moderator.',
      hometown: 'Besant Nagar, Chennai, India',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-10T14:20:00.000Z',
      updatedAt: '2026-01-10T14:20:00.000Z'
    },
    {
      _id: 'user-deepa-member',
      firstName: 'Deepa',
      lastName: 'Venkat',
      username: 'deepa_v',
      email: 'deepa@chennai.local',
      password: 'deepa123',
      passwordHash: 'deepa123',
      phoneNumber: '+91-98400-99001',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Teacher and avid gardener. Active member of Besant Nagar and Medavakkam.',
      hometown: 'Chennai, Tamil Nadu, India',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z'
    },
    {
      _id: 'user-greenfield-candidate',
      firstName: 'Oliver',
      lastName: 'Holloway',
      username: 'oliver_h',
      email: 'oliver@greenfield.local',
      password: 'oliver123',
      passwordHash: 'oliver123',
      phoneNumber: '+44-7700-900123',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      bio: 'Greenfield Village resident & historian. Active community participant.',
      hometown: 'Greenfield Village, Somerset, UK',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'public'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-20T11:00:00.000Z',
      updatedAt: '2026-01-20T11:00:00.000Z'
    },
    {
      _id: 'user-greenfield-mod',
      firstName: 'Emma',
      lastName: 'Watson-Smith',
      username: 'emma_ws',
      email: 'emma@greenfield.local',
      password: 'emma123',
      passwordHash: 'emma123',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Moderator keeping Greenfield Village discussions friendly.',
      hometown: 'Greenfield Village, Somerset, UK',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-21T11:00:00.000Z',
      updatedAt: '2026-01-21T11:00:00.000Z'
    }
  ],

  locations: [
    {
      _id: 'loc-besant-nagar',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Chennai District',
      townOrLocality: 'Besant Nagar',
      postalCode: '600090',
      latitude: 13.0002,
      longitude: 80.2668,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: 'loc-medavakkam',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Chennai District',
      townOrLocality: 'Medavakkam',
      postalCode: '600100',
      latitude: 12.9192,
      longitude: 80.1878,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: 'loc-velachery',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Chennai District',
      townOrLocality: 'Velachery',
      postalCode: '600042',
      latitude: 12.9759,
      longitude: 80.2212,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: 'loc-greenfield',
      country: 'United Kingdom',
      state: 'England',
      district: 'Somerset District',
      townOrLocality: 'Greenfield Village',
      postalCode: 'BA1 1AA',
      latitude: 51.3811,
      longitude: -2.3590,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: 'loc-brooklyn-heights',
      country: 'United States',
      state: 'New York',
      district: 'Kings County (Brooklyn)',
      townOrLocality: 'Brooklyn Heights',
      postalCode: '11201',
      latitude: 40.6960,
      longitude: -73.9933,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ],

  communities: [
    {
      _id: 'comm-besant-nagar',
      name: 'Besant Nagar',
      slug: 'besant-nagar',
      locationId: 'loc-besant-nagar',
      description: 'Official community hub for residents, businesses, and friends of Besant Nagar (Elliot Beach, 4th Main Road, Olcott Memorial, and surroundings).',
      profileImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
      memberCount: 4,
      status: 'active',
      adminCount: 2,
      moderatorCount: 1,
      contactEmail: 'contact@besantnagar.hometownhub.local',
      createdBy: 'user-arun-admin',
      approvedBy: 'user-platform-admin',
      approvedAt: '2026-01-05T09:00:00.000Z',
      createdAt: '2026-01-05T08:45:00.000Z',
      updatedAt: '2026-01-05T09:00:00.000Z'
    },
    {
      _id: 'comm-medavakkam',
      name: 'Medavakkam',
      slug: 'medavakkam',
      locationId: 'loc-medavakkam',
      description: 'Digital neighborhood forum for Medavakkam locality, connecting residents on local civic updates, parks, lake conservation, and cultural meets.',
      profileImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
      memberCount: 2,
      status: 'active',
      adminCount: 1,
      moderatorCount: 0,
      contactEmail: 'admin@medavakkam.hometownhub.local',
      createdBy: 'user-deepa-member',
      approvedBy: 'user-platform-admin',
      approvedAt: '2026-01-08T12:00:00.000Z',
      createdAt: '2026-01-08T11:00:00.000Z',
      updatedAt: '2026-01-08T12:00:00.000Z'
    },
    {
      _id: 'comm-velachery',
      name: 'Velachery',
      slug: 'velachery',
      locationId: 'loc-velachery',
      description: 'The official digital town square for Velachery residents, MRTS commuters, and local cultural societies.',
      profileImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&auto=format&fit=crop&q=80',
      memberCount: 1,
      status: 'active',
      adminCount: 1,
      moderatorCount: 0,
      contactEmail: 'contact@velachery.hometownhub.local',
      createdBy: 'user-arun-admin',
      approvedBy: 'user-platform-admin',
      approvedAt: '2026-01-10T15:00:00.000Z',
      createdAt: '2026-01-10T14:00:00.000Z',
      updatedAt: '2026-01-10T15:00:00.000Z'
    },
    {
      _id: 'comm-greenfield',
      name: 'Greenfield Village',
      slug: 'greenfield-village',
      locationId: 'loc-greenfield',
      description: 'Historical parish and village community in Somerset. (Currently Admin-less: under temporary Platform Admin oversight).',
      profileImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
      memberCount: 2,
      status: 'active',
      adminCount: 0, // Admin-less community!
      moderatorCount: 1,
      contactEmail: 'somerset-hub@hometownhub.local',
      createdBy: 'user-greenfield-candidate',
      approvedBy: 'user-platform-admin',
      approvedAt: '2026-01-12T10:00:00.000Z',
      createdAt: '2026-01-12T09:30:00.000Z',
      updatedAt: '2026-01-12T10:00:00.000Z'
    },
    {
      _id: 'comm-brooklyn-heights',
      name: 'Brooklyn Heights',
      slug: 'brooklyn-heights',
      locationId: 'loc-brooklyn-heights',
      description: 'Historic brownstone neighborhood community hub overlooking the Manhattan skyline.',
      profileImage: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80',
      memberCount: 1,
      status: 'active',
      adminCount: 1,
      moderatorCount: 0,
      contactEmail: 'admin@brooklynheights.hometownhub.local',
      createdBy: 'user-platform-admin',
      approvedBy: 'user-platform-admin',
      approvedAt: '2026-01-14T10:00:00.000Z',
      createdAt: '2026-01-14T09:00:00.000Z',
      updatedAt: '2026-01-14T10:00:00.000Z'
    }
  ],

  communityMemberships: [
    {
      _id: 'mem-arun-besant',
      userId: 'user-arun-admin',
      communityId: 'comm-besant-nagar',
      role: 'communityAdmin',
      membershipStatus: 'active',
      joinedAt: '2026-01-05T09:00:00.000Z'
    },
    {
      _id: 'mem-priya-besant',
      userId: 'user-priya-admin',
      communityId: 'comm-besant-nagar',
      role: 'communityAdmin',
      membershipStatus: 'active',
      joinedAt: '2026-01-06T10:30:00.000Z'
    },
    {
      _id: 'mem-karthik-besant',
      userId: 'user-karthik-mod',
      communityId: 'comm-besant-nagar',
      role: 'moderator',
      membershipStatus: 'active',
      joinedAt: '2026-01-10T14:30:00.000Z'
    },
    {
      _id: 'mem-deepa-besant',
      userId: 'user-deepa-member',
      communityId: 'comm-besant-nagar',
      role: 'member',
      membershipStatus: 'active',
      joinedAt: '2026-01-15T09:30:00.000Z'
    },
    {
      _id: 'mem-deepa-medavakkam',
      userId: 'user-deepa-member',
      communityId: 'comm-medavakkam',
      role: 'communityAdmin',
      membershipStatus: 'active',
      joinedAt: '2026-01-08T12:00:00.000Z'
    },
    {
      _id: 'mem-karthik-medavakkam',
      userId: 'user-karthik-mod',
      communityId: 'comm-medavakkam',
      role: 'member',
      membershipStatus: 'active',
      joinedAt: '2026-01-12T10:00:00.000Z'
    },
    {
      _id: 'mem-arun-medavakkam',
      userId: 'user-arun-admin',
      communityId: 'comm-medavakkam',
      role: 'member',
      membershipStatus: 'pending',
      joinedAt: '2026-02-01T10:00:00.000Z',
      verificationMethod: 'phone',
      verificationNotes: 'Pending phone verification from Community Admin Deepa.'
    },
    {
      _id: 'mem-arun-velachery',
      userId: 'user-arun-admin',
      communityId: 'comm-velachery',
      role: 'communityAdmin',
      membershipStatus: 'active',
      joinedAt: '2026-01-10T15:00:00.000Z'
    },
    {
      _id: 'mem-deepa-velachery',
      userId: 'user-deepa-member',
      communityId: 'comm-velachery',
      role: 'member',
      membershipStatus: 'active',
      joinedAt: '2026-01-15T11:00:00.000Z'
    },
    {
      _id: 'mem-oliver-greenfield',
      userId: 'user-greenfield-candidate',
      communityId: 'comm-greenfield',
      role: 'member',
      membershipStatus: 'active',
      joinedAt: '2026-01-20T11:15:00.000Z'
    },
    {
      _id: 'mem-emma-greenfield',
      userId: 'user-greenfield-mod',
      communityId: 'comm-greenfield',
      role: 'moderator',
      membershipStatus: 'active',
      joinedAt: '2026-01-21T11:15:00.000Z'
    },
    {
      _id: 'mem-admin-brooklyn',
      userId: 'user-platform-admin',
      communityId: 'comm-brooklyn-heights',
      role: 'communityAdmin',
      membershipStatus: 'active',
      joinedAt: '2026-01-14T10:00:00.000Z'
    }
  ],

  posts: [
    {
      _id: 'post-besant-announcement',
      communityId: 'comm-besant-nagar',
      authorId: 'user-arun-admin',
      title: '🚨 Official Advisory: Beach Promenade Coastal Cleanup & Eco-Bin Installation',
      content: 'Dear Besant Nagar residents and beach lovers,\n\nWe are pleased to announce the official rollout of 24 segregated eco-bins along Elliot Beach Promenade, partnered with our local youth volunteers. The community cleanup drive starts this Saturday at 6:30 AM.\n\nPlease join us near the Schmidt Memorial with gloves and reusable water bottles. Refreshments will be provided by local neighborhood bakeries.',
      category: 'Announcement',
      media: ['https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80'],
      isPinned: true,
      visibility: 'public',
      status: 'active',
      likeCount: 14,
      commentCount: 2,
      createdAt: '2026-02-10T08:00:00.000Z',
      updatedAt: '2026-02-10T08:00:00.000Z'
    },
    {
      _id: 'post-besant-news',
      communityId: 'comm-besant-nagar',
      authorId: 'user-priya-admin',
      title: 'Local News: New Pedestrian Crossings and Tree Canopies Approved for 4th Main Road',
      content: 'Great news for morning walkers and cyclists! Greater Chennai Corporation has approved our community proposal for raised pedestrian crossings, solar-powered crosswalk blinkers, and 50 native saplings along 4th Main Road.\n\nWork will commence next Tuesday from 10 PM to 4 AM to minimize traffic impact.',
      category: 'Local News',
      media: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'],
      isPinned: false,
      visibility: 'public',
      status: 'active',
      likeCount: 19,
      commentCount: 1,
      createdAt: '2026-02-12T14:30:00.000Z',
      updatedAt: '2026-02-12T14:30:00.000Z'
    },
    {
      _id: 'post-besant-culture',
      communityId: 'comm-besant-nagar',
      authorId: 'user-deepa-member',
      title: 'Margazhi & Classical Music Gathering at Spaces Arts Compound',
      content: 'Sharing a quick photo from yesterday evening acoustic veena recital at Spaces. It is so heartwarming to see the neighborhood come alive with classical arts under the banyan tree. Who else is attending the weekend vocal concert?',
      category: 'Culture',
      media: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'],
      isPinned: false,
      visibility: 'public',
      status: 'active',
      likeCount: 8,
      commentCount: 0,
      createdAt: '2026-02-14T18:00:00.000Z',
      updatedAt: '2026-02-14T18:00:00.000Z'
    },
    {
      _id: 'post-besant-private-discussion',
      communityId: 'comm-besant-nagar',
      authorId: 'user-karthik-mod',
      title: 'Resident-Only: Neighborhood Security & Night Patrol Roster (Feb-Mar)',
      content: 'This is a private update for verified Besant Nagar members. Here is the volunteer patrol roster for the interior streets around 6th Avenue. If you notice any defunct street lights, please drop the pole number below so our ward coordinator can expedite repairs.',
      category: 'Discussion',
      media: [],
      isPinned: false,
      visibility: 'private',
      status: 'active',
      likeCount: 5,
      commentCount: 1,
      createdAt: '2026-02-15T11:00:00.000Z',
      updatedAt: '2026-02-15T11:00:00.000Z'
    },
    {
      _id: 'post-greenfield-initiative',
      communityId: 'comm-greenfield',
      authorId: 'user-greenfield-candidate',
      title: 'Greenfield Village Orchard Restoration Project — Spring Volunteers Needed',
      content: 'The old parish apple orchard needs some pruning and fresh organic mulching before spring blossom. Looking for 8-10 volunteers this coming Sunday at 10 AM. Bring your garden shears!',
      category: 'Initiative',
      media: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'],
      isPinned: true,
      visibility: 'public',
      status: 'active',
      likeCount: 7,
      commentCount: 0,
      createdAt: '2026-02-16T09:00:00.000Z',
      updatedAt: '2026-02-16T09:00:00.000Z'
    }
  ],

  comments: [
    {
      _id: 'comment-1',
      postId: 'post-besant-announcement',
      authorId: 'user-deepa-member',
      parentCommentId: null,
      content: 'I will definitely be there with my family! Will there be collection bags for microplastics on the sand?',
      status: 'active',
      createdAt: '2026-02-10T09:15:00.000Z',
      updatedAt: '2026-02-10T09:15:00.000Z'
    },
    {
      _id: 'comment-2',
      postId: 'post-besant-announcement',
      authorId: 'user-arun-admin',
      parentCommentId: 'comment-1',
      content: 'Yes Deepa! We have special fine mesh sifters and biodegradable collection bags sponsored by Coastal Clean India.',
      status: 'active',
      createdAt: '2026-02-10T09:30:00.000Z',
      updatedAt: '2026-02-10T09:30:00.000Z'
    },
    {
      _id: 'comment-3',
      postId: 'post-besant-news',
      authorId: 'user-karthik-mod',
      parentCommentId: null,
      content: 'Much needed initiative. The pedestrian crossings will make it so much safer for children walking to Olcott School.',
      status: 'active',
      createdAt: '2026-02-12T15:00:00.000Z',
      updatedAt: '2026-02-12T15:00:00.000Z'
    },
    {
      _id: 'comment-4',
      postId: 'post-besant-private-discussion',
      authorId: 'user-arun-admin',
      parentCommentId: null,
      content: 'Pole #42 on 6th Avenue has been reported to TANGEDCO. Repair crew scheduled for tomorrow 11 AM.',
      status: 'active',
      createdAt: '2026-02-15T12:00:00.000Z',
      updatedAt: '2026-02-15T12:00:00.000Z'
    }
  ],

  reactions: [
    {
      _id: 'react-1',
      userId: 'user-deepa-member',
      postId: 'post-besant-announcement',
      reactionType: 'heart',
      createdAt: '2026-02-10T08:30:00.000Z'
    },
    {
      _id: 'react-2',
      userId: 'user-karthik-mod',
      postId: 'post-besant-announcement',
      reactionType: 'celebrate',
      createdAt: '2026-02-10T08:45:00.000Z'
    },
    {
      _id: 'react-3',
      userId: 'user-priya-admin',
      postId: 'post-besant-announcement',
      reactionType: 'like',
      createdAt: '2026-02-10T09:00:00.000Z'
    },
    {
      _id: 'react-4',
      userId: 'user-arun-admin',
      postId: 'post-besant-news',
      reactionType: 'helpful',
      createdAt: '2026-02-12T15:00:00.000Z'
    }
  ],

  roleOffers: [
    {
      _id: 'ro-deepa-mod-offer',
      communityId: 'comm-besant-nagar',
      userId: 'user-deepa-member',
      targetRole: 'moderator',
      offeredBy: 'user-arun-admin',
      status: 'pending',
      createdAt: '2026-02-16T12:00:00.000Z'
    }
  ],

  events: [
    {
      _id: 'event-besant-ongoing-now',
      communityId: 'comm-besant-nagar',
      createdBy: 'user-arun-admin',
      title: '🔴 LIVE NOW: Besant Nagar Morning Community Yoga & Beachside Wellness',
      description: 'Join us live at Elliot Beach promenade for our weekly sunrise yoga and breathwork session! All levels welcome.',
      location: 'Elliot Beach Promenade, Besant Nagar',
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80',
      capacity: 40,
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: 'user-arun-admin',
      approvedByRole: 'communityAdmin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participantCount: 12
    },
    {
      _id: 'event-besant-past-townhall',
      communityId: 'comm-besant-nagar',
      createdBy: 'user-arun-admin',
      title: 'Besant Nagar Quarter 1 Townhall & Coastal Waste Management Summit',
      description: 'Community consultation on municipal waste segregation, storm-water drain repairs, and youth volunteer programs.',
      location: 'Besant Nagar Community Center Auditorium',
      startTime: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      endTime: new Date(Date.now() - 7 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      capacity: 100,
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: 'user-arun-admin',
      approvedByRole: 'communityAdmin',
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      participantCount: 45
    },
    {
      _id: 'event-besant-cleanup',
      communityId: 'comm-besant-nagar',
      createdBy: 'user-arun-admin',
      title: 'Besant Nagar Elliot Beach Eco-Drive & Sand Restoration',
      description: 'Join your fellow neighbors for a morning beach cleanup, dune vegetation planting, and community breakfast. Tools and gloves provided.',
      location: 'Schmidt Memorial, Elliot Beach, Besant Nagar',
      startTime: '2026-08-22T06:30:00.000Z',
      endTime: '2026-08-22T09:00:00.000Z',
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      capacity: 50,
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: 'user-arun-admin',
      approvedByRole: 'communityAdmin',
      createdAt: '2026-02-10T08:00:00.000Z',
      updatedAt: '2026-02-10T08:00:00.000Z',
      participantCount: 3
    },
    {
      _id: 'event-besant-book-exchange',
      communityId: 'comm-besant-nagar',
      createdBy: 'user-deepa-member',
      title: 'Community Book & Seed Exchange under the Banyan Tree',
      description: 'Bring 2 books you love and any heirloom seeds or garden cuttings to swap with fellow neighbors. Open discussion on sustainable living.',
      location: 'Besant Gardens (Opposite Theosophical Society entrance)',
      startTime: '2026-08-29T16:00:00.000Z',
      endTime: '2026-08-29T18:30:00.000Z',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80',
      capacity: 30,
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: 'user-priya-admin',
      approvedByRole: 'communityAdmin',
      createdAt: '2026-02-12T10:00:00.000Z',
      updatedAt: '2026-02-12T11:00:00.000Z',
      participantCount: 2
    },
    {
      _id: 'event-besant-pending-proposal',
      communityId: 'comm-besant-nagar',
      createdBy: 'user-deepa-member',
      title: 'Heritage Walk: Architecture of Old Besant Nagar & Kalakshetra Colony',
      description: 'A 2-hour guided walking tour exploring 1960s coastal architecture, art sanctuaries, and traditional courtyard homes.',
      location: 'Starting at Kalakshetra Gate 1',
      startTime: '2026-09-05T07:00:00.000Z',
      endTime: '2026-09-05T09:00:00.000Z',
      coverImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
      capacity: 25,
      status: 'active',
      approvalStatus: 'pending', // Pending community admin review
      createdAt: '2026-02-16T15:00:00.000Z',
      updatedAt: '2026-02-16T15:00:00.000Z',
      participantCount: 1
    },
    {
      _id: 'event-greenfield-fete',
      communityId: 'comm-greenfield',
      createdBy: 'user-greenfield-candidate',
      title: 'Greenfield Village Traditional Summer Fete & Craft Fair',
      description: 'Annual village gathering featuring local honey, homemade pies, traditional folk fiddle, and children games on the green.',
      location: 'The Village Green, Greenfield',
      startTime: '2026-09-12T11:00:00.000Z',
      endTime: '2026-09-12T17:00:00.000Z',
      coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      capacity: 100,
      status: 'active',
      approvalStatus: 'pending', // Awaiting Platform Admin approval because Greenfield is Admin-less!
      createdAt: '2026-02-16T10:00:00.000Z',
      updatedAt: '2026-02-16T10:00:00.000Z',
      participantCount: 2
    }
  ],

  eventParticipants: [
    {
      _id: 'ep-1',
      eventId: 'event-besant-cleanup',
      userId: 'user-arun-admin',
      participationStatus: 'going',
      joinedAt: '2026-02-10T08:00:00.000Z'
    },
    {
      _id: 'ep-2',
      eventId: 'event-besant-cleanup',
      userId: 'user-priya-admin',
      participationStatus: 'going',
      joinedAt: '2026-02-10T08:15:00.000Z'
    },
    {
      _id: 'ep-3',
      eventId: 'event-besant-cleanup',
      userId: 'user-deepa-member',
      participationStatus: 'going',
      joinedAt: '2026-02-10T09:00:00.000Z'
    },
    {
      _id: 'ep-4',
      eventId: 'event-besant-book-exchange',
      userId: 'user-deepa-member',
      participationStatus: 'going',
      joinedAt: '2026-02-12T10:00:00.000Z'
    },
    {
      _id: 'ep-5',
      eventId: 'event-besant-book-exchange',
      userId: 'user-karthik-mod',
      participationStatus: 'interested',
      joinedAt: '2026-02-12T11:30:00.000Z'
    }
  ],

  communityCreationRequests: [
    {
      _id: 'req-mylapore',
      requestedBy: 'user-deepa-member',
      proposedCommunityName: 'Mylapore Heritage Precinct',
      location: {
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Chennai District',
        townOrLocality: 'Mylapore',
        postalCode: '600004',
        latitude: 13.0336,
        longitude: 80.2687
      },
      description: 'Official community hub for Mylapore residents, Kapaleeshwarar temple street neighborhoods, and local cultural societies.',
      status: 'pending',
      similarityWarning: undefined,
      createdAt: '2026-02-14T10:00:00.000Z'
    },
    {
      _id: 'req-besant-duplicate-test',
      requestedBy: 'user-deepa-member',
      proposedCommunityName: 'Besant Nagar Beachfront Club',
      location: {
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Chennai District',
        townOrLocality: 'Besant Nagar',
        postalCode: '600090',
        latitude: 13.0002,
        longitude: 80.2668
      },
      description: 'Exclusive club group for Besant Nagar residents.',
      status: 'pending',
      similarityWarning: 'Exact duplicate locality match found: "Besant Nagar" (Country + State + District + Locality already has an active community).',
      createdAt: '2026-02-15T12:00:00.000Z'
    },
    {
      _id: 'req-shinjuku',
      requestedBy: 'user-greenfield-candidate',
      proposedCommunityName: 'Shinjuku Central',
      location: {
        country: 'Japan',
        state: 'Tokyo',
        district: 'Shinjuku City',
        townOrLocality: 'Shinjuku',
        postalCode: '160-0022',
        latitude: 35.6938,
        longitude: 139.7034
      },
      description: 'Global community hub for residents and business owners of Shinjuku ward.',
      status: 'pending',
      similarityWarning: undefined,
      createdAt: '2026-02-16T08:00:00.000Z'
    }
  ],

  communityAdminInvitations: [
    {
      _id: 'inv-greenfield-oliver',
      communityId: 'comm-greenfield',
      invitedUserId: 'user-greenfield-candidate',
      invitedByPlatformAdmin: 'user-platform-admin',
      status: 'pending',
      createdAt: '2026-02-16T10:30:00.000Z'
    }
  ],

  notifications: [
    {
      _id: 'notif-1',
      recipientId: 'user-greenfield-candidate',
      type: 'admin_invitation',
      title: 'Community Admin Invitation',
      message: 'Platform Admin has invited you to become Community Admin for Greenfield Village.',
      referenceType: 'invitation',
      referenceId: 'inv-greenfield-oliver',
      isRead: false,
      createdAt: '2026-02-16T10:30:00.000Z'
    },
    {
      _id: 'notif-2',
      recipientId: 'user-arun-admin',
      type: 'community_announcement',
      title: 'Co-Admin Activity',
      message: 'Priya Sundaram posted an update: "New Pedestrian Crossings and Tree Canopies Approved".',
      referenceType: 'post',
      referenceId: 'post-besant-news',
      isRead: true,
      createdAt: '2026-02-12T14:30:00.000Z'
    },
    {
      _id: 'notif-3',
      recipientId: 'user-deepa-member',
      type: 'event_approved',
      title: 'Event Proposal Approved! 🎉',
      message: 'Your proposal "Community Book & Seed Exchange" was approved by Priya Sundaram.',
      referenceType: 'event',
      referenceId: 'event-besant-book-exchange',
      isRead: false,
      createdAt: '2026-02-12T11:00:00.000Z'
    }
  ],

  reports: [
    {
      _id: 'rep-1',
      reporterId: 'user-deepa-member',
      targetType: 'comment',
      targetId: 'comment-spam-sample',
      targetSnippet: 'Buy crypto now at fast-profit.test!',
      communityId: 'comm-besant-nagar',
      reason: 'Spam / Commercial Advertising',
      description: 'Suspicious bot comment advertising external crypto link.',
      status: 'resolved',
      reviewedBy: 'user-karthik-mod',
      reviewedAt: '2026-02-11T10:00:00.000Z',
      resolution: 'Content soft-deleted by Moderator Karthik Raman.',
      createdAt: '2026-02-11T09:45:00.000Z'
    }
  ],

  auditLogs: [
    {
      _id: 'audit-1',
      actorId: 'user-platform-admin',
      action: 'APPROVE_COMMUNITY_CREATION',
      targetType: 'community',
      targetId: 'comm-besant-nagar',
      communityId: 'comm-besant-nagar',
      metadata: { name: 'Besant Nagar', country: 'India', locality: 'Besant Nagar' },
      createdAt: '2026-01-05T09:00:00.000Z'
    },
    {
      _id: 'audit-2',
      actorId: 'user-arun-admin',
      action: 'PROMOTE_CO_ADMIN',
      targetType: 'user',
      targetId: 'user-priya-admin',
      communityId: 'comm-besant-nagar',
      metadata: { promotedUser: 'Priya Sundaram', role: 'communityAdmin' },
      createdAt: '2026-01-06T10:30:00.000Z'
    },
    {
      _id: 'audit-3',
      actorId: 'user-priya-admin',
      action: 'APPOINT_MODERATOR',
      targetType: 'user',
      targetId: 'user-karthik-mod',
      communityId: 'comm-besant-nagar',
      metadata: { appointedUser: 'Karthik Raman', role: 'moderator' },
      createdAt: '2026-01-10T14:30:00.000Z'
    }
  ]
};
