export const getQueryVariable = variable => {
  const query = window.location.search.substring(1),
    vars = query.split('&');

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');

    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1]);
    }
  }

  return null;
};

export const writeLinksToDOM = links => {
  document.write('<ul>');

  links.forEach((link, i) => {
    document.write(
      `<li><a href="${link}" target="_blank">Link for participant ${i}</a></li>`
    );
  });

  document.write('</ul>');
};
