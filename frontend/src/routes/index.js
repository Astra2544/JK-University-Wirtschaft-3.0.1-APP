/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ROUTES INDEX | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Route-Konfiguration (Legacy).
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Welcome from '../pages/Welcome';

export default function Routes() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
    </Switch>
  );
}
