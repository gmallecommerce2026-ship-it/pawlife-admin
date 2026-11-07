// Quan hệ và giá trị mặc định của các model admin, mô phỏng schema.prisma
export type Rel =
  | { kind: "one"; model: string; local: string }
  | { kind: "many"; model: string; foreign: string };

export const REL: Record<string, Record<string, Rel>> = {
  User: {
    adminRoles: { kind: "many", model: "AdminRoleAssignment", foreign: "userId" },
    ownedShelters: { kind: "many", model: "Shelter", foreign: "ownerId" },
    shelterStaff: { kind: "many", model: "ShelterStaff", foreign: "userId" },
    applications: { kind: "many", model: "AdoptionApplication", foreign: "applicantId" },
    eventInterests: { kind: "many", model: "EventInterest", foreign: "userId" },
    eventHides: { kind: "many", model: "EventHide", foreign: "userId" },
    placeProposals: { kind: "many", model: "PlaceProposal", foreign: "submitterId" },
    placeReviews: { kind: "many", model: "PlaceReview", foreign: "authorId" },
    reportsMade: { kind: "many", model: "Report", foreign: "reporterId" },
    auditLogs: { kind: "many", model: "AuditLog", foreign: "adminId" },
    notifications: { kind: "many", model: "Notification", foreign: "userId" },
    installs: { kind: "many", model: "AppInstall", foreign: "userId" },
  },
  Shelter: {
    owner: { kind: "one", model: "User", local: "ownerId" },
    pets: { kind: "many", model: "Pet", foreign: "shelterId" },
    applications: { kind: "many", model: "AdoptionApplication", foreign: "shelterId" },
    staff: { kind: "many", model: "ShelterStaff", foreign: "shelterId" },
    events: { kind: "many", model: "Event", foreign: "shelterId" },
  },
  Pet: {
    shelter: { kind: "one", model: "Shelter", local: "shelterId" },
    applications: { kind: "many", model: "AdoptionApplication", foreign: "petId" },
  },
  ShelterStaff: {
    shelter: { kind: "one", model: "Shelter", local: "shelterId" },
    user: { kind: "one", model: "User", local: "userId" },
  },
  AdoptionApplication: {
    shelter: { kind: "one", model: "Shelter", local: "shelterId" },
    pet: { kind: "one", model: "Pet", local: "petId" },
    applicant: { kind: "one", model: "User", local: "applicantId" },
  },
  Organizer: {
    events: { kind: "many", model: "Event", foreign: "organizerId" },
  },
  Event: {
    organizer: { kind: "one", model: "Organizer", local: "organizerId" },
    shelter: { kind: "one", model: "Shelter", local: "shelterId" },
    interests: { kind: "many", model: "EventInterest", foreign: "eventId" },
    hides: { kind: "many", model: "EventHide", foreign: "eventId" },
  },
  EventInterest: {
    event: { kind: "one", model: "Event", local: "eventId" },
    user: { kind: "one", model: "User", local: "userId" },
  },
  EventHide: {
    event: { kind: "one", model: "Event", local: "eventId" },
    user: { kind: "one", model: "User", local: "userId" },
  },
  PlaceProposal: {
    submitter: { kind: "one", model: "User", local: "submitterId" },
  },
  Place: {
    reviews: { kind: "many", model: "PlaceReview", foreign: "placeId" },
    pets: { kind: "many", model: "PlacePet", foreign: "placeId" },
  },
  PlaceReview: {
    place: { kind: "one", model: "Place", local: "placeId" },
    author: { kind: "one", model: "User", local: "authorId" },
  },
  PlacePet: {
    place: { kind: "one", model: "Place", local: "placeId" },
  },
  Report: {
    reporter: { kind: "one", model: "User", local: "reporterId" },
  },
  AuditLog: {
    admin: { kind: "one", model: "User", local: "adminId" },
  },
  Notification: {
    user: { kind: "one", model: "User", local: "userId" },
  },
  AppInstall: {
    user: { kind: "one", model: "User", local: "userId" },
  },
  AdminRoleAssignment: {
    user: { kind: "one", model: "User", local: "userId" },
  },
};

export const DEFAULTS: Record<string, () => Record<string, any>> = {
  User: () => ({ role: "CUSTOMER", points: 0, totalSpent: 0, lockedUntil: null, lockedPermanently: false, lockReason: null, lastActiveAt: null, fullName: null, phoneNumber: null, passwordHash: "" }),
  Shelter: () => ({ status: "PENDING", statusNote: null, email: null, phone: null, address: null, lat: null, lng: null, description: null, imageUrl: null }),
  Pet: () => ({ status: "AVAILABLE", breed: null, imageUrl: null, description: null }),
  ShelterStaff: () => ({ role: "STAFF" }),
  AdoptionApplication: () => ({ status: "NEW", note: null }),
  Organizer: () => ({ bio: null, avatarUrl: null, coverUrl: null, isVerified: false }),
  Event: () => ({ status: "DRAFT", statusNote: null, pinned: false, endsAt: null, descriptionVi: null, descriptionEn: null, locationName: null, lat: null, lng: null, coverUrl: null, galleryUrls: null, organizerId: null, shelterId: null, area: "Khác" }),
  EventInterest: () => ({}),
  EventHide: () => ({}),
  PlaceProposal: () => ({ status: "PENDING", phone: null, website: null, description: null, rejectReason: null, infoRequest: null, placeId: null }),
  Place: () => ({ city: null, phone: null, description: null, openingHours: null, amenities: null, menuText: null, coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: false, hiddenReason: null }),
  PlaceReview: () => ({ imageUrls: null, isRemoved: false, removedReason: null }),
  PlacePet: () => ({ imageUrl: null, isActive: true, species: "Khác" }),
  PlaceCategory: () => ({ isVisible: true, sortOrder: 0 }),
  Amenity: () => ({ isVisible: true }),
  Report: () => ({ status: "NEW" }),
  AuditLog: () => ({ before: null, after: null, ip: null, outcome: "SUCCESS" }),
  Notification: () => ({ readAt: null }),
  AppInstall: () => ({ userId: null, uninstalledAt: null }),
  AdminRoleAssignment: () => ({}),
};
