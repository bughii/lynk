export const HOST = import.meta.env.VITE_SERVER_URL || "http://localhost";

export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/add-profile-image`;
export const REMOVE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/remove-profile-image`;

export const CONTACTS_ROUTES = "api/contacts";
export const ADD_CONTACT_ROUTES = `${CONTACTS_ROUTES}/search`;

export const MESSAGES_ROUTES = "api/messages";
export const GET_MESSAGES_ROUTE = `${MESSAGES_ROUTES}/get-messages`;
export const SEND_FILE_ROUTE = `${MESSAGES_ROUTES}/upload-file`;
export const UPDATE_APPEARANCE_ROUTE = `${MESSAGES_ROUTES}/update-appearance`;

export const FRIENDS_ROUTES = "api/friendship";
export const GET_FRIENDS_PREVIEW_ROUTE = `${FRIENDS_ROUTES}/get-friends-preview`;

export const GROUPS_ROUTES = "api/groups";
export const CREATE_GROUP_ROUTE = `${GROUPS_ROUTES}/create-group`;
export const GET_GROUP_MESSAGES = `${GROUPS_ROUTES}/get-group-messages`;
