const publicBaseUrl = import.meta.env.BASE_URL || '/';

export const publicAsset = (path) => `${publicBaseUrl}${path.replace(/^\/+/, '')}`;

export const LOGIN_LOGO_SRC = publicAsset('images/logo_login.png');
export const HEADER_LOGO_SRC = publicAsset('images/logo_header.png');
export const LOGIN_DRAGON_SRC = publicAsset('images/dragon_login.png');
