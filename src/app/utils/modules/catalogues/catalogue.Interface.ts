import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  catalogueInterface,
  menuBasicInterface,
} from '@utils/commons.interface';
import { FormCmsComponent } from '@utils/components/form-cms/form-cms.component';
import { CatalogueFormComponent } from './catalogue-form/catalogue-form.component';

export interface CatalogueRoutesInterface {
  title: string;
  name: string;
  dependency?: depCatalogueInterface;
  subMenu?: menuBasicInterface[];
  afterComplete?: (
    data: catalogueInterface,
    matDialog: MatDialog,
    matDialogRef: MatDialogRef<CatalogueFormComponent>
  ) => void;
}

export interface depCatalogueInterface {
  name: string;
  id: string;
}
