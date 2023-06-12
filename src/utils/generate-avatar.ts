const randomHexColor = () => {
  return Math.floor(Math.random() * 16777215).toString(16);
};
export const generateAvatar = (name: string) => {
  const url = new URL('https://ui-avatars.com/api/');
  url.searchParams.append('name', name);
  url.searchParams.append('background', randomHexColor());
  url.searchParams.append('size', '128');
  url.searchParams.append('bold', 'true');
  return url.toString();
};
