import type { NextFunction, Response } from "express";
import {
  hasModulePermission,
  type ModulePermissionAction,
  type ModulePermissionKey
} from "../services/modulePermissions";
import type { RequestWithUser } from "../types/http";

const ACTION_LABELS: Record<ModulePermissionAction, string> = {
  view: "visualizar",
  create: "criar",
  edit: "editar",
  delete: "excluir"
};

export const ensureModulePermission = (
  req: RequestWithUser,
  res: Response,
  moduleKey: ModulePermissionKey,
  action: ModulePermissionAction,
  customMessage?: string
) => {
  if (!req.organizationMembership) {
    res.status(403).json({ message: "Permissao de organizacao nao encontrada." });
    return false;
  }

  if (!hasModulePermission(req.organizationMembership, moduleKey, action)) {
    res
      .status(403)
      .json({ message: customMessage ?? `Voce nao tem permissao para ${ACTION_LABELS[action]} neste modulo.` });
    return false;
  }

  return true;
};

export const requireModulePermission =
  (moduleKey: ModulePermissionKey, action: ModulePermissionAction, customMessage?: string) =>
  (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!ensureModulePermission(req, res, moduleKey, action, customMessage)) {
      return;
    }
    next();
  };
