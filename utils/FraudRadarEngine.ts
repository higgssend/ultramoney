import { Client, Loan, BankAccount, ClientRelationship } from '../types';

export interface CrossGuarantorAlert {
  clientAId: string;
  clientAName: string;
  clientAPhone?: string;
  clientBId: string;
  clientBName: string;
  clientBPhone?: string;
  loanAId?: string;
  loanBId?: string;
  totalExposedBalance: number;
  alertType: 'Garante Cruzado Directo (A ⇄ B)' | 'Garante Circular (A → B → C → A)';
  severity: 'Crítico' | 'Alto';
  description: string;
}

export interface SharedDataAlert {
  matchType: 'Teléfono / WhatsApp' | 'Dirección Física' | 'Cuenta Bancaria' | 'Cédula / Documento';
  sharedValue: string;
  involvedClients: { id: string; name: string; phone?: string; cedula?: string }[];
  severity: 'Crítico' | 'Alto' | 'Medio';
  description: string;
}

export interface RelationshipNode {
  id: string;
  name: string;
  type: 'client' | 'guarantor';
  phone?: string;
  activeLoansCount: number;
  totalBalance: number;
}

export interface RelationshipEdge {
  fromId: string;
  toId: string;
  relationshipType: string;
  notes?: string;
}

export class FraudRadarEngine {

  /**
   * Detects Cross Guarantors:
   * 1. Direct Cross (A is guarantor of B AND B is guarantor of A)
   * 2. Multiple cross exposure
   */
  public static detectCrossGuarantors(clients: Client[], loans: Loan[]): CrossGuarantorAlert[] {
    const alerts: CrossGuarantorAlert[] = [];
    const clientMap = new Map<string, Client>();
    clients.forEach(c => clientMap.set(c.id, c));

    // Map: Borrower ID -> Array of Guarantor IDs or Names
    const loanGuarantorPairs: { borrowerId: string; borrowerName: string; guarantorId?: string; guarantorName: string; loanId: string; balance: number }[] = [];

    loans.forEach(loan => {
      if (loan.remainingBalance <= 0) return;

      // Extract guarantors
      if (loan.guarantors && Array.isArray(loan.guarantors)) {
        loan.guarantors.forEach(g => {
          if (g && g.name) {
            // Check if guarantor matches an existing client
            const matchedClient = clients.find(c => 
              (g.cedula && c.cedula && c.cedula.replace(/\D/g, '') === g.cedula.replace(/\D/g, '')) ||
              (g.phone && c.phone && c.phone.replace(/\D/g, '') === g.phone.replace(/\D/g, '')) ||
              (c.name.toLowerCase().trim() === g.name.toLowerCase().trim())
            );

            loanGuarantorPairs.push({
              borrowerId: loan.clientId,
              borrowerName: loan.clientName,
              guarantorId: matchedClient?.id || g.id,
              guarantorName: g.name,
              loanId: loan.id,
              balance: Number(loan.remainingBalance) || 0
            });
          }
        });
      } else if (loan.guarantor && loan.guarantor.name) {
        const g = loan.guarantor;
        const matchedClient = clients.find(c => 
          (g.cedula && c.cedula && c.cedula.replace(/\D/g, '') === g.cedula.replace(/\D/g, '')) ||
          (c.name.toLowerCase().trim() === g.name.toLowerCase().trim())
        );

        loanGuarantorPairs.push({
          borrowerId: loan.clientId,
          borrowerName: loan.clientName,
          guarantorId: matchedClient?.id || loan.guarantorId,
          guarantorName: g.name,
          loanId: loan.id,
          balance: Number(loan.remainingBalance) || 0
        });
      }
    });

    const checkedPairs = new Set<string>();

    for (let i = 0; i < loanGuarantorPairs.length; i++) {
      const pairA = loanGuarantorPairs[i];
      if (!pairA.guarantorId) continue;

      for (let j = i + 1; j < loanGuarantorPairs.length; j++) {
        const pairB = loanGuarantorPairs[j];
        if (!pairB.guarantorId) continue;

        // Check if Pair A's borrower is Pair B's guarantor AND Pair B's borrower is Pair A's guarantor
        const isCross = (
          (pairA.borrowerId === pairB.guarantorId && pairA.guarantorId === pairB.borrowerId) ||
          (pairA.borrowerName.toLowerCase().trim() === pairB.guarantorName.toLowerCase().trim() && 
           pairA.guarantorName.toLowerCase().trim() === pairB.borrowerName.toLowerCase().trim())
        );

        if (isCross) {
          const pairKey = [pairA.borrowerName, pairB.borrowerName].sort().join('___');
          if (!checkedPairs.has(pairKey)) {
            checkedPairs.add(pairKey);

            const clientA = clientMap.get(pairA.borrowerId);
            const clientB = clientMap.get(pairB.borrowerId);

            alerts.push({
              clientAId: pairA.borrowerId,
              clientAName: pairA.borrowerName,
              clientAPhone: clientA?.phone,
              clientBId: pairB.borrowerId,
              clientBName: pairB.borrowerName,
              clientBPhone: clientB?.phone,
              loanAId: pairA.loanId,
              loanBId: pairB.loanId,
              totalExposedBalance: pairA.balance + pairB.balance,
              alertType: 'Garante Cruzado Directo (A ⇄ B)',
              severity: 'Crítico',
              description: `Vínculo de fianza cruzada riesgoso: ${pairA.borrowerName} es garante de ${pairB.borrowerName} y viceversa. En caso de insolvencia, ninguna garantía es ejecutable de forma independiente.`
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Detects Duplicate / Shared Identifiers:
   * - Same Phone / WhatsApp between different clients
   * - Same Physical Address / Sector reference
   * - Same Bank Account shared across clients
   * - Duplicate Cédula
   */
  public static detectSharedData(
    clients: Client[],
    bankAccounts: BankAccount[] = []
  ): SharedDataAlert[] {
    const alerts: SharedDataAlert[] = [];

    // 1. Phone duplicates
    const phoneMap = new Map<string, Client[]>();
    clients.forEach(c => {
      const cleanPhone = (c.phone || c.whatsapp || '').replace(/\D/g, '');
      if (cleanPhone.length >= 7) {
        const list = phoneMap.get(cleanPhone) || [];
        list.push(c);
        phoneMap.set(cleanPhone, list);
      }
    });

    phoneMap.forEach((matchedClients, phone) => {
      if (matchedClients.length > 1) {
        alerts.push({
          matchType: 'Teléfono / WhatsApp',
          sharedValue: phone,
          involvedClients: matchedClients.map(c => ({ id: c.id, name: c.name, phone: c.phone, cedula: c.cedula })),
          severity: 'Alto',
          description: `El número telefónico (${phone}) está registrado en ${matchedClients.length} clientes distintos (${matchedClients.map(c => c.name).join(', ')}).`
        });
      }
    });

    // 2. Cedula duplicates (Exact match on sanitized cedula)
    const cedulaMap = new Map<string, Client[]>();
    clients.forEach(c => {
      const cleanCedula = (c.cedula || '').replace(/\D/g, '');
      if (cleanCedula.length >= 7) {
        const list = cedulaMap.get(cleanCedula) || [];
        list.push(c);
        cedulaMap.set(cleanCedula, list);
      }
    });

    cedulaMap.forEach((matchedClients, cedula) => {
      if (matchedClients.length > 1) {
        alerts.push({
          matchType: 'Cédula / Documento',
          sharedValue: cedula,
          involvedClients: matchedClients.map(c => ({ id: c.id, name: c.name, phone: c.phone, cedula: c.cedula })),
          severity: 'Crítico',
          description: `Posible identidad duplicada: La cédula ${cedula} coincide exactamente en ${matchedClients.length} registros.`
        });
      }
    });

    // 3. Address duplicates (Substantial match > 10 chars)
    const addressMap = new Map<string, Client[]>();
    clients.forEach(c => {
      const cleanAddress = (c.address || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (cleanAddress.length >= 12) {
        const list = addressMap.get(cleanAddress) || [];
        list.push(c);
        addressMap.set(cleanAddress, list);
      }
    });

    addressMap.forEach((matchedClients, addressKey) => {
      if (matchedClients.length > 1) {
        alerts.push({
          matchType: 'Dirección Física',
          sharedValue: matchedClients[0].address || addressKey,
          involvedClients: matchedClients.map(c => ({ id: c.id, name: c.name, phone: c.phone, cedula: c.cedula })),
          severity: 'Medio',
          description: `Misma dirección residencial o comercial compartida entre ${matchedClients.length} clientes (${matchedClients.map(c => c.name).join(', ')}).`
        });
      }
    });

    // 4. Bank Account duplicates
    const accountMap = new Map<string, BankAccount[]>();
    bankAccounts.forEach(acc => {
      const cleanAcc = (acc.accountNumber || '').replace(/\D/g, '');
      if (cleanAcc.length >= 6) {
        const list = accountMap.get(cleanAcc) || [];
        list.push(acc);
        accountMap.set(cleanAcc, list);
      }
    });

    accountMap.forEach((matchedAccs, accNum) => {
      const uniqueClientIds = Array.from(new Set(matchedAccs.map(a => a.clientId)));
      if (uniqueClientIds.length > 1) {
        const involved = clients.filter(c => uniqueClientIds.includes(c.id));
        alerts.push({
          matchType: 'Cuenta Bancaria',
          sharedValue: `No. ${accNum} (${matchedAccs[0].bankName})`,
          involvedClients: involved.map(c => ({ id: c.id, name: c.name, phone: c.phone, cedula: c.cedula })),
          severity: 'Crítico',
          description: `Misma cuenta bancaria registrada para desembolsos o cobros entre ${involved.length} clientes diferentes.`
        });
      }
    });

    return alerts;
  }

  /**
   * Generates graph nodes and links for family, commercial, and guarantor relationships
   */
  public static buildRelationshipGraph(
    clients: Client[],
    loans: Loan[],
    manualRelationships: ClientRelationship[]
  ): { nodes: RelationshipNode[]; edges: RelationshipEdge[] } {
    const nodesMap = new Map<string, RelationshipNode>();
    const edges: RelationshipEdge[] = [];

    // Add clients to nodes
    clients.forEach(c => {
      const clientLoans = loans.filter(l => l.clientId === c.id && l.status !== LoanStatus.PAID && Number(l.remainingBalance) > 0);
      const totalBalance = clientLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

      nodesMap.set(c.id, {
        id: c.id,
        name: c.name,
        type: 'client',
        phone: c.phone,
        activeLoansCount: clientLoans.length,
        totalBalance
      });
    });

    // Add guarantor edges from loans
    loans.forEach(loan => {
      if (loan.remainingBalance <= 0) return;

      const guarantorList = loan.guarantors || (loan.guarantor ? [loan.guarantor] : []);
      guarantorList.forEach(g => {
        if (g && g.name) {
          const matchedClient = clients.find(c => c.name.toLowerCase().trim() === g.name.toLowerCase().trim());
          const gId = matchedClient?.id || `guar-${g.name.replace(/\s+/g, '-').toLowerCase()}`;

          if (!nodesMap.has(gId)) {
            nodesMap.set(gId, {
              id: gId,
              name: g.name,
              type: 'guarantor',
              phone: g.phone,
              activeLoansCount: 0,
              totalBalance: 0
            });
          }

          edges.push({
            fromId: gId,
            toId: loan.clientId,
            relationshipType: 'Garante Solidario',
            notes: `Préstamo #${loan.id} (RD$ ${Number(loan.remainingBalance || 0).toLocaleString()})`
          });
        }
      });
    });

    // Add manual relationships
    manualRelationships.forEach(rel => {
      if (!nodesMap.has(rel.clientIdA)) {
        nodesMap.set(rel.clientIdA, { id: rel.clientIdA, name: rel.clientNameA, type: 'client', activeLoansCount: 0, totalBalance: 0 });
      }
      if (!nodesMap.has(rel.clientIdB)) {
        nodesMap.set(rel.clientIdB, { id: rel.clientIdB, name: rel.clientNameB, type: 'client', activeLoansCount: 0, totalBalance: 0 });
      }

      edges.push({
        fromId: rel.clientIdA,
        toId: rel.clientIdB,
        relationshipType: rel.relationshipType,
        notes: rel.notes
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      edges
    };
  }
}
