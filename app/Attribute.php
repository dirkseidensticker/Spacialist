<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Attribute extends Model
{
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'thesaurus_url',
        'thesaurus_root_url',
        'datatype',
    ];

    public function children() {
        return $this->hasMany('App\Attribute', 'parent_id');
    }

    public function entities() {
        return $this->belongsToMany('App\Entity', 'attribute_values')->withPivot('entity_val', 'str_val', 'int_val', 'dbl_val', 'dt_val', 'certainty', 'certainty_description', 'lasteditor', 'thesaurus_val', 'json_val', 'geography_val');
    }

    public function entity_types() {
        return $this->belongsToMany('App\EntityType', 'entity_attributes')->withPivot('position');
    }

    public function parent() {
        return $this->belongsTo('App\Attribute', 'parent_id');
    }

    // This relationship is one-way, in case the has-relation is needed it must be implemented
    public function thesaurus_root_concept() {
        return $this->belongsTo('App\ThConcept', 'thesaurus_root_url', 'concept_url');
    }

    // This relationship is one-way, in case the has-relation is needed it must be implemented
    public function thesaurus_concept() {
        return $this->belongsTo('App\ThConcept', 'thesaurus_url', 'concept_url');
    }

}
