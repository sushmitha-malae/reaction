import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import { Translation, IconButton } from "/imports/plugins/core/ui/client/components";
import { Reaction } from "/client/api";
import DiscountForm from "./form";

class DiscountList extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  // handle remove click
  handleClick(event, codeId) {
    return Meteor.call("discounts/codes/remove", this.props.id, codeId, this.props.collection);
  }
  // list items
  renderList() {
    const listItems = this.props.listItems.map((listItem) => this.renderItem(listItem.id, listItem.code));

    return (
      <div className="rui list-group">{listItems}</div>
    );
  }
  // render item
  renderItem(_id, code) {
    let TrashCan;

    if (this.props.collection !== "Orders") {
      TrashCan = (
        <div className="pull-right">
          <IconButton icon="fa fa-remove" onClick={(e) => this.handleClick(e, _id)}/>
        </div>
      );
    }
    return (
      <div className="rui list-group-item" key={_id}>
        <span>
          {code}&nbsp;
          <Translation defaultValue="code" i18nKey={"discounts.code"} />&nbsp;
          <Translation defaultValue="Discount applied" i18nKey={"discounts.applied"} />
        </span>
        {TrashCan}
      </div>
    );
  }

  // load form input view
  renderNoneFound() {
    return (
      <DiscountForm id={this.props.id} collection={this.props.collection} validatedInput={this.props.validatedInput} />
    );
  }

  // render list view
  render() {
    const { listItems } = this.props;
    return (listItems.length >= 1) ? this.renderList() : this.renderNoneFound();
  }
}

DiscountList.propTypes = {
  collection: PropTypes.string,
  id: PropTypes.string,
  listItems: PropTypes.array,
  validatedInput: PropTypes.bool
};

function composer(props, onData) {
  const currentCart = Reaction.Collections[props.collection].findOne({
    _id: props.id
  });

  const listItems = [];
  for (const billing of currentCart.billing) {
    if (billing.paymentMethod && billing.paymentMethod.processor === "code") {
      listItems.push({
        id: billing._id,
        code: billing.paymentMethod.code,
        discount: billing.paymentMethod.amount
      });
      // Found discount payment method. break here for good measure, just in case there's another "code" payment method.
      // Which I think can happen only if "cart/submitPayment" is executed multiple times, e.g. if DDP connection broke.
      break;
    }
  }

  onData(null, {
    collection: props.collection,
    validatedInput: props.validatedInput,
    id: props.id,
    listItems
  });
}

const options = {
  propsToWatch: ["billing"]
};

const discountListComponent = composeWithTracker(composer, options)(DiscountList);
registerComponent("DiscountList", discountListComponent);

export default discountListComponent;
