
function storeVote(party, president, vicePresident) {
    localStorage.setItem('vote_party', party);
    localStorage.setItem('vote_president', president);
    localStorage.setItem('vote_vice', vicePresident);
}
  
function displayVote() {
    const president = localStorage.getItem('vote_president');
    const vicePresident = localStorage.getItem('vote_vice');
  
    if (president && vicePresident) {
      document.getElementById('president').innerText = `For president: ${president}`;
      document.getElementById('vice-president').innerText = `For vice president: ${vicePresident}`;
    }
}
  
function finalizeVote() {
    localStorage.removeItem('vote_party');
    localStorage.removeItem('vote_president');
    localStorage.removeItem('vote_vice');
    window.location.href = 'end.html';
}
  