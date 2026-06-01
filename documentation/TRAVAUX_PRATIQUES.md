# 📚 TRAVAUX PRATIQUES ECOTRACK - PostgreSQL Avancé

**Objectif**: Transformer votre base PostgreSQL en système production robuste, performant et sécurisé

**Durée estimée**: 4-5 jours  
**Technologies**: PostgreSQL 16 + pgAdmin + (futur: Supabase)

---

## 🎯 Résumé de la mission

Votre prototype fonctionne avec Docker + pgAdmin. Maintenant:

1. **AUDITER** la base (taille, index, performances)
2. **OPTIMISER** les requêtes lentes (index, partitionnement)
3. **SÉCURISER** avec RLS et historisation
4. **PRÉPARER** pour Supabase (futur)

---

## 📂 Structure des fichiers

```
travaux_pratiques/
├── README.md                    ← Démarrage rapide
├── CHECKLIST.md                 ← À cocher au fur et à mesure
│
├── docs/
│   ├── audit_postgresql.md      ← État actuel (tables, taille, index)
│   ├── requetes_lentes.md       ← Identifier les bottlenecks
│   ├── projection.md             ← Croissance en 1 an
│   ├── optimisation_index.md    ← Créer des index intelligents
│   ├── partitionnement.md       ← Diviser measurements (350M lignes)
│   ├── jsonb_integration.md     ← Métadonnées flexibles IoT
│   ├── historisation.md         ← Tracer changements (SCD Type 2)
│   ├── rls_policies.md          ← Sécurité au niveau des lignes
│   ├── config_postgresql.md     ← Tuning performance
│   └── realtime_config.md       ← Préparer Supabase Realtime
│
└── migrations/
    ├── 001_schema_initial.sql     ← Tables de base
    ├── 002_ajouter_jsonb.sql      ← Colonnes JSONB
    ├── 003_indexes.sql             ← Indexes optimisés
    ├── 004_partitionnement.sql    ← Partitions mensuelles
    ├── 005_rls.sql                 ← Row Level Security
    ├── functions.sql               ← Fonctions PL/pgSQL
    └── policies.sql                ← RLS policies détaillées
```

---

## 📖 Guide de lecture

**Si tu es nouveau**, lis dans cet ordre:

1. `README.md` (ce dossier)
2. `docs/audit_postgresql.md` + exécute les queries SQL
3. `docs/requetes_lentes.md` + teste tes requêtes
4. `docs/projection.md` + fais les calculs
5. (Optionnel) `docs/optimisation_index.md` + crée index
6. (Optionnel) `docs/partitionnement.md` + partitionne
7. (Optionnel) `docs/jsonb_integration.md` + teste JSONB
8. (Optionnel) `docs/historisation.md` + créé historique
9. (Optionnel) `docs/rls_policies.md` + crée policies
10. (Futur) `docs/config_postgresql.md` + `docs/realtime_config.md`

---

## 🔥 Point de départ RAPIDE

### 1. Voir tes tables

```sql
-- Copy/paste dans pgAdmin Query Tool
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as taille
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

Résultat? → Mets-le dans `docs/audit_postgresql.md`

### 2. Teste une requête

```sql
-- Prends une requête que tu utilises souvent
EXPLAIN ANALYZE SELECT * FROM measurements WHERE container_id = 123;
```

Résultat "Seq Scan"? → Besoin d'index  
Résultat "Index Scan"? → Bon!  
→ Documente dans `docs/requetes_lentes.md`

### 3. Crée ton premier index

```sql
-- Si tu as pas d'index sur container_id
CREATE INDEX idx_measurements_container ON measurements(container_id);
EXPLAIN ANALYZE SELECT * FROM measurements WHERE container_id = 123;
```

Gain? 10x plus rapide? → Bravo!  
→ Documente dans `docs/optimisation_index.md`

---

## ⚠️ Pièges à éviter

1. **Modifier la structure SANS sauvegarde** → BOOM, données perdues!
   - Sauvegarde TOUJOURS avant `ALTER TABLE`

2. **Créer trop d'index** → Ralentit INSERT/UPDATE/DELETE
   - Créer SEULEMENT après EXPLAIN ANALYZE

3. **Oublier la PK sur une table** → Replication impossible après
   - Vérifie toutes tables ont `PRIMARY KEY`

4. **Utiliser JSON au lieu de JSONB** → Plus lent
   - JSONB = binaire, indexable, rapide

5. **RLS sans test** → Lockout utilisateurs
   - Test toujours avec plusieurs rôles

---

## 🚀 Points clés à comprendre

| Concept | Explication simple |
|---|---|
| **Index** | Comme un index de livre: facilite de trouver une page sans lire le tout |
| **Partitionnement** | Diviser une grosse table en petites tables par mois/trimestre = requêtes plus rapides |
| **JSONB** | Stockage flexible pour données qui changent (métadonnées capteur, etc) |
| **RLS** | Chaque utilisateur voit seulement ses données (collecteur ne voit que sa zone) |
| **SCD Type 2** | Garder l'historique: l'ancien role + la date quand ça a changé |
| **Triggers** | Fonction SQL qui s'exécute automatiquement quand tu modifies une ligne |

---

## 📊 Objectifs mesurables

À la fin, tu dois pouvoir dire:

- ✅ "Ma table measurements a X million lignes et Y GB"
- ✅ "Mes requêtes étaient Z ms, maintenant Y ms (gain A%)"
- ✅ "J'ai partitionné la table pour gérer 350M lignes"
- ✅ "Mon collecteur voit SEULEMENT sa zone grâce à RLS"
- ✅ "Je peux tracer qui a changé quoi et quand"
- ✅ "Les timestamps sont indexés avec BRIN pour perf"
- ✅ "Les métadonnées IoT sont flexibles avec JSONB"

---

## 💡 Comment compléter les docs

**Chaque fichier markdown = à remplir:**

```
Ton travail:
1. Exécute les queries SQL suggérées dans pgAdmin
2. Note les résultats
3. Remplis les tableaus
4. Documente tes découvertes
5. Coche la checklist
```

**Format simple:**
- Ajoute les résultats SQL dans les tableaux
- Nota les temps AVANT/APRÈS
- Explique en une phrase pourquoi c'est plus rapide

---

## 🆘 Bloqué?

1. **Relis le fichier markdown** (chaque section a pistes)
2. **Regarde les queries SQL** (toutes prêtes à copier)
3. **Demande à enseignant** (>30 min bloqué = demande aide!)
4. **Entraide encouragée** (discute avec camarades)
5. **Mais code seul** (copier-coller complet = NON)

---

## 📚 Ressources

- **PostgreSQL docs**: https://www.postgresql.org/docs/current/
- **pgAdmin**: http://localhost:5050 (username: admin@ecotrack.com)
- **Votre Docker**: `docker ps` pour voir les bases

---

## ✨ BONUS (si vous avez fini tôt)

- PostGIS pour géolocalisation (haversine, GIS queries)
- pg_stat_statements pour monitoring requêtes
- Supabase Edge Functions (serverless)
- Alertes automatiques avec pg_cron
- API GraphQL auto-généré

---

**Commencez par `docs/audit_postgresql.md` →**

*Bonne chance! 🚀*
