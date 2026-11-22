import { Link } from 'react-router-dom';
import '../styles/Blog.css';
import '../styles/Legal.css';
import usePageTitle from '../hooks/usePageTitle';

// Ce que le site collecte réellement, pourquoi, et combien de temps.
// Chaque durée correspond à un mécanisme existant (suppression du compte,
// lien de désinscription, commande purger_contacts côté serveur).
const DONNEES = [
  {
    quoi: 'Compte',
    detail: 'Prénom, nom, email, mot de passe (jamais stocké en clair)',
    pourquoi: 'Vous connecter et publier vos articles',
    duree: 'Jusqu’à la suppression de votre compte',
  },
  {
    quoi: 'Message de contact',
    detail: 'Nom, prénom, email, message',
    pourquoi: 'Vous répondre',
    duree: '12 mois au plus',
  },
  {
    quoi: 'Newsletter',
    detail: 'Email',
    pourquoi: 'Vous envoyer nos articles',
    duree: 'Jusqu’à votre désinscription',
  },
];

/** Politique de confidentialité : ce que Weeb fait de vos données (RGPD). */
const Confidentialite = () => {
  usePageTitle('Confidentialité');
  return (
    <article className="article-page legal-page">
      <header className="article-header">
        <h1>Politique de confidentialité</h1>
        <p className="article-excerpt">
          Ce que nous faisons de vos données, expliqué simplement. Nous ne collectons que le strict
          nécessaire, et vous gardez la main dessus.
        </p>
      </header>

      <div className="article-content">
        <h2>Qui est responsable de vos données ?</h2>
        <p>
          Weeb, l&apos;éditeur de ce blog. Pour toute question sur vos données, écrivez-nous depuis
          la page <Link to="/contact">Contact</Link>.
        </p>

        <h2>Quelles données, pour quoi faire, et combien de temps ?</h2>
        <div className="legal-table-wrapper">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Quand</th>
                <th scope="col">Données</th>
                <th scope="col">Pourquoi</th>
                <th scope="col">Conservées</th>
              </tr>
            </thead>
            <tbody>
              {DONNEES.map((ligne) => (
                <tr key={ligne.quoi}>
                  <th scope="row">{ligne.quoi}</th>
                  <td>{ligne.detail}</td>
                  <td>{ligne.pourquoi}</td>
                  <td>{ligne.duree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Nous ne vendons ni ne partageons vos données. Elles ne servent jamais à de la publicité.
        </p>

        <h2>Où sont-elles stockées ?</h2>
        <p>
          Dans l&apos;Union européenne. Le serveur et la base de données sont hébergés à Francfort.
          Les pages du site sont servies par Vercel, un hébergeur américain, qui transmet aussi vos
          échanges au serveur. Les emails partent par Brevo, un service français. Les erreurs
          techniques du site sont suivies avec Sentry, sans votre adresse IP ni aucune donnée
          personnelle. Aucun autre service n&apos;est appelé : même la police d&apos;écriture est
          fournie par le site.
        </p>

        <h2>Et les cookies ?</h2>
        <p>
          Nous n&apos;utilisons aucun cookie publicitaire ni de mesure d&apos;audience. Quand vous
          êtes connecté, un seul cookie vous garde connecté. Il est indispensable, illisible par
          les scripts de la page, et supprimé à la déconnexion.
        </p>

        <h2>Vos droits</h2>
        <ul className="legal-list">
          <li>
            <strong>Consulter et corriger</strong> vos informations : depuis{' '}
            <Link to="/mon-espace">Mon espace</Link>.
          </li>
          <li>
            <strong>Supprimer</strong> votre compte et vos articles : depuis Mon espace, en un clic.
          </li>
          <li>
            <strong>Quitter la newsletter</strong> : avec le lien reçu dans l&apos;email de
            bienvenue.
          </li>
          <li>
            <strong>Toute autre demande</strong> : par la page <Link to="/contact">Contact</Link>.
            Nous répondons sous un mois.
          </li>
        </ul>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL
          (cnil.fr).
        </p>

        <h2>Comment vos données sont protégées</h2>
        <p>
          Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe sont transformés de
          façon irréversible avant d&apos;être enregistrés. Seuls les administrateurs de Weeb ont
          accès aux données, depuis un espace protégé.
        </p>
      </div>
    </article>
  );
};

export default Confidentialite;
