<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Nicolaslopezj\Searchable\SearchableTrait;

class Bibliography extends Model
{
    use SearchableTrait;

    protected $table = 'literature';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'author',
        'editor',
        'title',
        'journal',
        'year',
        'pages',
        'volume',
        'number',
        'booktitle',
        'publisher',
        'address',
        'misc',
        'howpublished',
        'type',
        'annote',
        'chapter',
        'crossref',
        'edition',
        'institution',
        'key',
        'month',
        'note',
        'organization',
        'school',
        'series',
        'citekey'
    ];

    protected $searchable = [
        'columns' => [
            'author' => 10,
            'editor' => 10,
            'title' => 10,
            'journal' => 10,
            'year' => 10,
            'pages' => 5,
            'volume' => 5,
            'number' => 5,
            'booktitle' => 10,
            'publisher' => 10,
            'address' => 5,
            'misc' => 8,
            'howpublished' => 5,
            'type' => 5,
            'annote' => 5,
            'chapter' => 5,
            'crossref' => 5,
            'edition' => 5,
            'institution' => 5,
            'key' => 5,
            'month' => 5,
            'note' => 5,
            'organization' => 5,
            'school' => 5,
            'series' => 5,
            'citekey' => 5
        ]
    ];

    const patchRules = [
        'author'    => 'string',
        'editor'    => 'string',
        'title'     => 'string',
        'journal'   => 'string',
        'year'      => 'string',
        'pages'     => 'string',
        'volume'    => 'string',
        'number'    => 'string',
        'booktitle' => 'string',
        'publisher' => 'string',
        'address'   => 'string',
        'misc'      => 'string',
        'howpublished'=> 'string',
        'type'      => 'string',
        'annote'    => 'string',
        'chapter'   => 'string',
        'crossref'  => 'string',
        'edition'   => 'string',
        'institution'=> 'string',
        'key'       => 'string',
        'month'     => 'string',
        'note'      => 'string',
        'organization'=> 'string',
        'school'    => 'string',
        'series'    => 'string'
    ];

    public function fieldsFromRequest($request, $user) {
        foreach($request->toArray() as $key => $value){
            $this->{$key} = $value;
        }

        $this->citekey = self::computeCitationKey($this->toArray());
        if($this->citekey === null) {
            return response([
                'error' => 'Could not compute citation key.'
            ], 400);
        }
        $this->lasteditor = $user->name;
        $this->save();
    }

    public function referenceCount() {
        return Reference::where('literature_id', $this->id)->count();
    }

    public static function computeCitationKey($fields) {
        $key;
        if(isset($fields['author'])) {
            $key = $fields['author'];
        } else {
            $key = $fields['title'];
        }
        // Use first two letters of author/title as key with only first letter uppercase
        $key = ucwords(mb_strtolower(substr($key, 0, 2))) . ':';
        if($fields['year'] != null) {
            $key .= $fields['year'];
        } else {
            $key .= '0000';
        }

        $initalKey = $key;
        $suffixes = array_merge(range('a', 'z'), range('A', 'Z'));
        $suffixesCount = count($suffixes);
        $i = 0;
        $j = 0;
        while(self::where('citekey', $key)->first() !== null) {
            // if single letter was not enough to be unique, add another
            if($i == $suffixesCount) {
                if($j == $suffixesCount) $j = 0;
                $initalKey = $initalKey . $suffixes[$j++];
                $i = 0;
            }
            $key = $initalKey . $suffixes[$i++];
        }
        return $key;
    }

    public function contexts() {
        return $this->belongsToMany('App\Context', 'sources')->withPivot('description', 'attribute_id');
    }
}
