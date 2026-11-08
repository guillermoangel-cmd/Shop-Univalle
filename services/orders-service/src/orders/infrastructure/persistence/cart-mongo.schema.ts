import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CartItemSubdocument {
  @Prop({ required: true, trim: true })
  productId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  imageUrl!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1, default: 1 })
  quantity!: number;

  @Prop({ default: true })
  selected!: boolean;

  @Prop({ default: false })
  favorite!: boolean;
}

export const CartItemSubdocumentSchema =
  SchemaFactory.createForClass(CartItemSubdocument);

@Schema({ collection: 'carts', timestamps: true })
export class CartMongoDocument {
  @Prop({ required: true, unique: true, trim: true, index: true })
  userId!: string;

  @Prop({ type: [CartItemSubdocumentSchema], default: [] })
  items!: CartItemSubdocument[];

  @Prop({ type: String, default: null })
  promoCode!: string | null;

  @Prop({ type: Number, default: 0 })
  discountRate!: number;
}

export const CartMongoSchema = SchemaFactory.createForClass(CartMongoDocument);

