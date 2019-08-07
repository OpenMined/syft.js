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
  document.getElementById('participant-links').innerHTML = `
    <ul>
    ${links
      .map(
        (link, i) =>
          `
          <li>
            <a href="${link}" target="_blank">Link for participant ${i + 1}</a>
          </li>
          `
      )
      .join('')}
    </ul>
  `;
};

export const writeIdentityToDOM = text => {
  document.getElementById('identity').innerHTML = text;
};
