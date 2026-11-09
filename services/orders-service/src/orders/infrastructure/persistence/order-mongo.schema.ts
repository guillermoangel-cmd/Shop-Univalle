import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CartItemSubdocument,
  CartItemSubdocumentSchema,
} from './cart-mongo.schema.js';

@Schema({ collection: 'orders', timestamps: true })
export class OrderMongoDocument {
  @Prop({ required: true, unique: true, trim: true })
  orderNumber!: string;

  @Prop({ required: true, trim: true, index: true })
  userId!: string;

  @Prop({ required: true, trim: true, index: true, default: 'default-store' })
  storeProfileId!: string;

  @Prop({ required: true, trim: true, default: '' })
  deliveryAddress!: string;

  @Prop({ required: true, enum: ['AUTHENTICATED', 'GUEST'], default: 'AUTHENTICATED' })
  checkoutMode!: 'AUTHENTICATED' | 'GUEST';

  @Prop({ type: [CartItemSubdocumentSchema], required: true })
  items!: CartItemSubdocument[];

  @Prop({ required: true, min: 1 })
  totalItems!: number;

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ required: true, min: 0, default: 0 })
  discountAmount!: number;

  @Prop({ required: true, min: 0 })
  estimatedShipping!: number;

  @Prop({ required: true, min: 0 })
  taxes!: number;

  @Prop({ required: true, min: 0 })
  totalFinal!: number;

  @Prop({ type: String, default: null })
  promoCode!: string | null;

  @Prop({
    required: true,
    enum: ['PENDING_PAYMENT', 'PAID', 'CANCELLED'],
    default: 'PENDING_PAYMENT',
  })
  status!: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

  createdAt?: Date;
}

export const OrderMongoSchema =
  SchemaFactory.createForClass(OrderMongoDocument);
