/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Reference,
  ReferenceKind,
  TsReference,
} from '../passes/reference_resolution/reference_kinds';
import {InputDescriptor} from '../utils/input_id';
import {CompilationUnitData, SerializableForBatching} from './unit_data';

/** Merges a list of compilation units into a combined unit. */
export function mergeCompilationUnitData(
  metadataFiles: CompilationUnitData[],
): CompilationUnitData {
  const result: CompilationUnitData = {
    knownInputs: {},
    references: [],
  };

  const seenReferenceFromIds = new Set<string>();

  for (const file of metadataFiles) {
    for (const [key, info] of Object.entries(file.knownInputs)) {
      const existing = result.knownInputs[key];
      if (existing === undefined) {
        result.knownInputs[key] = info;
        continue;
      }

      if (existing.isIncompatible === null && info.isIncompatible) {
        // input might not be incompatible in one target, but others might invalidate it.
        // merge the incompatibility state.
        existing.isIncompatible = info.isIncompatible;
      }
      if (!existing.seenAsSourceInput && info.seenAsSourceInput) {
        existing.seenAsSourceInput = true;
      }
    }
  }

  for (const info of Object.values(result.knownInputs)) {
    // We never saw a source file for this input, globally. Mark it as incompatible,
    // so that all references and inheritance checks can propagate accordingly.
    if (!info.seenAsSourceInput) {
      info.isIncompatible = {
        kind: IncompatibilityType.VIA_INPUT,
        reason: InputIncompatibilityReason.OutsideOfMigrationScope,
      };
    }
  }

  return result;
}

/** Computes a unique ID for the given reference. */
function computeReferenceId(
  reference: SerializableForBatching<Reference<InputDescriptor>>,
): string {
  if (reference.kind === ReferenceKind.InTemplate) {
    return `${reference.from.templateFile.id}@@${reference.from.read.positionEndInFile}`;
  } else if (reference.kind === ReferenceKind.InHostBinding) {
    // `read` position is commonly relative to the host property node position— so we need
    // to make it absolute by incorporating the host node position.
    return (
      `${reference.from.file.id}@@${reference.from.hostPropertyNode.positionEndInFile}` +
      `@@${reference.from.read.positionEndInFile}`
    );
  } else {
    return `${reference.from.file.id}@@${reference.from.node.positionEndInFile}`;
  }
}
