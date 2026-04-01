document.addEventListener("DOMContentLoaded", function() {
  // Change "Passphrase Lockdown" to "Mot de passe pour accéder"
  var pLabel = document.querySelector(".input-group-text");
  if (pLabel && pLabel.textContent.trim() === "Passphrase Lockdown") {
    pLabel.textContent = "Mot de passe pour acc\u00e9der";
  }
  // Change placeholder
  var pInput = document.getElementById("push_passphrase");
  if (pInput) {
    pInput.placeholder = "Optionnel : les destinataires devront entrer ce mot de passe pour voir le contenu";
  }
  // Insert tip block after the expiration sliders
  var whichever = document.querySelector(".text-center.form-text");
  if (whichever) {
    var tipDiv = document.createElement("div");
    tipDiv.id = "cw-tip-block";
    tipDiv.innerHTML = "<strong>Astuce :</strong> Entrez uniquement un mot de passe dans le champ texte. D\u2019autres informations d\u2019identification peuvent compromettre la s\u00e9curit\u00e9.<br><br>Les mots de passe sont chiffr\u00e9s avant \u00e9criture et ne sont disponibles que pour ceux qui connaissent le lien priv\u00e9. Une fois expir\u00e9s, les mots de passe chiffr\u00e9s sont d\u00e9finitivement supprim\u00e9s de la base de donn\u00e9es.";
    whichever.parentElement.parentElement.after(tipDiv);
  }
});
