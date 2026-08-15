import { Dialog } from "@/ui/primitives";

import { priceToInput } from "../lib";
import { type ItemFormValues } from "../schemas";
import { type Area, type Category, type Item, type ItemDraft } from "../types";

import { ItemForm } from "./item-form";

function toFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    price: priceToInput(item.price),
    quantity: String(item.quantity),
    priority: item.priority,
    link: item.link ?? "",
    note: item.note ?? "",
    areaId: item.area_id ?? "",
    categoryId: item.category_id ?? "",
  };
}

type EditItemDialogProps = {
  item: Item;
  areas: Area[];
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, draft: ItemDraft) => Promise<void>;
};

export function EditItemDialog({ item, areas, categories, onClose, onSave }: EditItemDialogProps) {
  return (
    <Dialog
      title="Editar item"
      eyebrow="Lista de desejos"
      closeLabel="Fechar edição"
      onClose={onClose}
    >
      <ItemForm
        areas={areas}
        categories={categories}
        initialValues={toFormValues(item)}
        submitLabel="Salvar alterações"
        focusNameOnMount
        onCancel={onClose}
        onSubmit={(draft) => onSave(item.id, draft)}
      />
    </Dialog>
  );
}
