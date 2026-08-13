/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * STIX 2.1 & GraphML Export Engine for NEXUS OSINT Platform
 */

import { OsintEntity } from '../osintData';

export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  objects: Array<Record<string, any>>;
}

/**
 * Converts OSINT Entity and its relationships into STIX 2.1 standard format.
 */
export function convertEntityToStix21(entity: OsintEntity): StixBundle {
  const timestamp = new Date().toISOString();
  const bundleId = `bundle--${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`;
  
  // Base STIX Object: Identity / Threat-Actor / Infrastructure / Malware
  const stixObjectType = entity.type === 'company' 
    ? 'identity' 
    : entity.type === 'person' 
      ? 'identity' 
      : 'infrastructure';

  const mainStixObject: Record<string, any> = {
    type: stixObjectType,
    spec_version: '2.1',
    id: `${stixObjectType}--${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`,
    created: timestamp,
    modified: timestamp,
    name: entity.name,
    description: `OSINT Risk Dossier for ${entity.name}. Risk Score: ${entity.riskScore}%. Status: ${entity.status}`,
    identity_class: entity.type === 'company' ? 'organization' : entity.type === 'person' ? 'individual' : 'system',
    custom_properties: {
      nexus_risk_score: entity.riskScore,
      nexus_entity_code: entity.code,
      nexus_status: entity.status,
      nexus_offshore_flag: entity.isOffshoreFlag,
      nexus_pep_flag: entity.isPepFlag
    }
  };

  const stixObjects: Array<Record<string, any>> = [mainStixObject];

  // Map relationships to STIX Relationship objects
  if (entity.relations && entity.relations.length > 0) {
    entity.relations.forEach((rel) => {
      const relTargetId = `identity--${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`;
      
      const targetObject: Record<string, any> = {
        type: 'identity',
        spec_version: '2.1',
        id: relTargetId,
        created: timestamp,
        modified: timestamp,
        name: rel.targetName,
        identity_class: rel.targetType === 'company' ? 'organization' : 'individual',
        custom_properties: {
          relation_type: rel.relationType,
          share_percent: rel.sharePercent || 0
        }
      };

      const relationshipObject: Record<string, any> = {
        type: 'relationship',
        spec_version: '2.1',
        id: `relationship--${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`,
        created: timestamp,
        modified: timestamp,
        relationship_type: rel.relationType.toLowerCase().includes('бенефіціар') ? 'owned-by' : 'related-to',
        source_ref: mainStixObject['id'],
        target_ref: relTargetId,
        description: `${rel.relationType} (${rel.sharePercent ? rel.sharePercent + '%' : '100%'})`
      };

      stixObjects.push(targetObject, relationshipObject);
    });
  }

  return {
    type: 'bundle',
    id: bundleId,
    spec_version: '2.1',
    objects: stixObjects
  };
}

/**
 * Converts OSINT Entity and its relationships into GraphML XML format for Gephi / Cytoscape / Maltego.
 */
export function convertEntityToGraphML(entity: OsintEntity): string {
  const sanitize = (str: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="d0" for="node" attr.name="name" attr.type="string"/>
  <key id="d1" for="node" attr.name="type" attr.type="string"/>
  <key id="d2" for="node" attr.name="riskScore" attr.type="int"/>
  <key id="d3" for="node" attr.name="status" attr.type="string"/>
  <key id="e0" for="edge" attr.name="relationType" attr.type="string"/>
  <key id="e1" for="edge" attr.name="sharePercent" attr.type="double"/>
  <graph id="G" edgedefault="directed">
`;

  // Root Node
  const rootId = `n_${entity.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  xml += `    <node id="${rootId}">
      <data key="d0">${sanitize(entity.name)}</data>
      <data key="d1">${sanitize(entity.type)}</data>
      <data key="d2">${entity.riskScore}</data>
      <data key="d3">${sanitize(entity.status)}</data>
    </node>
`;

  // Relations
  if (entity.relations && entity.relations.length > 0) {
    entity.relations.forEach((rel, idx) => {
      const targetId = `n_target_${idx}_${sanitize(rel.targetName).replace(/[^a-zA-Z0-9_]/g, '_')}`;
      xml += `    <node id="${targetId}">
      <data key="d0">${sanitize(rel.targetName)}</data>
      <data key="d1">${sanitize(rel.targetType)}</data>
      <data key="d2">${rel.riskScore || 50}</data>
      <data key="d3">LINKED</data>
    </node>
    <edge id="e_${idx}" source="${rootId}" target="${targetId}">
      <data key="e0">${sanitize(rel.relationType)}</data>
      <data key="e1">${rel.sharePercent || 0}</data>
    </edge>
`;
    });
  }

  xml += `  </graph>
</graphml>`;

  return xml;
}

/**
 * Triggers a browser download for text/file content.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
