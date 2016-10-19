<?php

namespace App\Http\Controllers;
use Log;
use App\User;
use \DB;
use Illuminate\Http\Request;

class ContextController extends Controller {
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct() {
        //
    }

    public function get() {
        return response()->json(
            DB::table('context_types as c')
                ->select('c.th_uri as index', 'ca.c_id as cid', 'ca.a_id as aid', 'a.datatype', 'c.type',
                    DB::raw("public.\"getLabelForId\"(C.th_uri, 'de') AS title, public.\"getLabelForId\"(A.th_uri, 'de') AS val")
                )
                ->leftJoin('context_attributes as ca', 'c.id', '=', 'ca.c_id')
                ->leftJoin('attributes as a', 'ca.a_id', '=', 'a.id')
                ->where('c.type', '=', '0')
                ->orderBy('val')
                ->get()
        );
    }

    public function getAll() {
        return response()->json(
            [
                'finds' =>
                    DB::table('finds')
                    ->select('name', 'c_id as cid, id')
                    ->get()
            ]
        );
    }

    public function getAttributes($id) {
        $rows = DB::table('context_types as c')
        ->select('ca.c_id as cid', 'ca.a_id as aid', 'a.datatype', 'a.th_root as root',
            DB::raw("public.\"getLabelForId\"(C.th_uri, 'de') AS title, public.\"getLabelForId\"(A.th_uri, 'de') AS val")
        )
        ->leftJoin('context_attributes as ca', 'c.id', '=', 'ca.c_id')
        ->leftJoin('attributes as a', 'ca.a_id', '=', 'a.id')
        ->where('c.id', '=', $id)
        ->get();
        foreach($rows as &$row) {
            if(!isset($row->root)) continue;
            $rootId = DB::table('th_concept')
                ->select('id_th_concept')
                ->where('concept_url', '=', $row->root)
                ->first();
            if(!isset($rootId)) continue;
            $rootId = $rootId->id_th_concept;
            $row->choices = DB::select("
                WITH RECURSIVE
                top AS (
                    SELECT br.broader_id, br.narrower_id, public.\"getLabeForTmpid\"(br.broader_id, 'de') as broad, public.\"getLabeForTmpid\"(br.narrower_id, 'de') as narr
                    FROM th_broaders br
                    WHERE broader_id = $rootId
                    UNION
                    SELECT br.broader_id, br.narrower_id, public.\"getLabeForTmpid\"(br.broader_id, 'de') as broad, public.\"getLabeForTmpid\"(br.narrower_id, 'de') as narr
                    FROM top t, th_broaders br
                    WHERE t.narrower_id = br.broader_id
                )
                SELECT *
                FROM top
            ");
        }
        // TODO get option attributes
        /*foreach($rows as &$row) {
            if($row->datatype == "option") {
                $row->attributes = getOptionsForId($db, $row['root']);
            }
        }*/
        return response()->json($rows);
    }

    public function getType($id) {
        $finds = DB::table('finds')->get();
        foreach($finds as &$find) {
            $attribs = DB::table('context_values as CV')
                    ->join('attributes as A', 'CV.a_id', 'A.id')
                    ->where('f_id', $find->id)
                    ->select('CV.*', 'A.datatype', 'A.th_root')
                    ->get();
            foreach($attribs as &$attr) {
                if($attr->datatype == 'literature') {
                    $attr->literature_info = DB::table('bib_tex')->where('id', $attr->str_val)->first();
                }
            }
            $find->attributes = $attribs;
        }
        return response()->json($finds);
    }

    public function getArtifacts() {
        return response()->json(
            DB::table('context_types as c')
                ->select('c.th_uri as index', 'ca.c_id as cid', 'ca.a_id as aid', 'a.datatype', 'c.type',
                    DB::raw(
                        "public.\"getLabelForId\"(C.th_uri, 'de') AS title, public.\"getLabelForId\"(A.th_uri, 'de') AS val"
                    )
                )
                ->leftJoin('context_attributes as ca', 'c.id', '=', 'ca.c_id')
                ->leftJoin('attributes as a', 'ca.a_id', '=', 'a.id')
                ->where('c.type', '=', '1')
                ->orderBy('val')
                ->get()
        );
    }

    public function getChildren($id) {
        $intId = filter_var($id, FILTER_VALIDATE_INT);
        if($intId === false || $intId <= 0) return;
        $rows = DB::select(
            "WITH RECURSIVE
            q AS (
                SELECT  f.*
                FROM    finds f
                WHERE   id = $id
                UNION ALL
                SELECT  fc.*
                FROM    q
                JOIN    finds fc
                ON      fc.root = q.id
            )
            SELECT  q.*, ct.type, ct.th_uri AS typename
            FROM    q
            JOIN context_types AS ct
            ON q.c_id = ct.id
            ORDER BY id ASC"
        );
        $roots = array();
        foreach($rows as $row) {
            if(empty($row)) continue;
            $row->data = DB::table('context_values')->where('f_id', $row->id)->get();
            if(!empty($row->root)) $roots[$row->root][] = $row;
        }
        return response()->json($roots);
    }

    public function add(Request $request) {
        //$title = $request->get('title');
        $lat = $request->get('lat');
        $lng = $request->get('lng');
        $id = $request->get('id');
        $name = $request->get('name');
        $cid = $request->get('cid');
        $fid = -1;
        if($id > 0) {
            DB::table('finds')
                ->where('id', $id)
                ->update([
                    'name' => $name,
                    'lat' => $lat,
                    'lng' => $lng
                ]);
            $fid = $id;
        } else {
            $fid = DB::table('finds')
                ->insertGetId([
                    'name' => $name,
                    'c_id' => $cid,
                    'lat' => $lat,
                    'lng' => $lng
                ]);
        }
        foreach($request->except(['title', 'lat', 'lng', 'id', 'name', 'cid', 'images']) as $key => $value) {
            $ids = explode("_", $key);
            $aid = $ids[1];
            if(!empty($ids[2])) {
                $oid = $ids[2];
                $tbl = 'option_values';
                $isOption = true;
            } else {
                $tbl = 'context_values';
                $isOption = false;
            }
            $jsonArr = json_decode($value, true);
            if(is_array($jsonArr)) {
                if($id > 0) {
                    $dbEntries = array(
                        ['f_id', $fid],
                        ['a_id', $aid]
                    );
                    if($isOption) $dbEntries[] = ['o_id', $oid];
                    $rows = DB::table($tbl)
                        ->where($dbEntries)
                        ->get();
                    foreach($rows as $row) {
                        $alreadySet = false;
                        foreach($jsonArr as $k => $v) {
                            if(isset($v['name'])) $set = $v['name'];
                            else if(isset($v['shorttitle'])) $set = $v['id'];
                            else continue;
                            if($row->str_val === $set) {
                                unset($jsonArr[$k]);
                                $alreadySet = true;
                                break;
                            }
                        }
                        if(!$alreadySet) {
                            $del = array(
                                ['f_id', $fid],
                                ['a_id', $aid],
                                ['str_val', $row->str_val]
                            );
                            if($isOption) $del[] = ['o_id', $oid];
                            DB::table($tbl)
                                ->where($del)
                                ->delete();
                        }
                    }
                }
                foreach($jsonArr as $v) {
                    if(isset($v['name'])) $set = $v['name'];
                    else if(isset($v['shorttitle'])) $set = $v['id'];
                    else continue;
                    $vals = array(
                        'f_id' => $fid,
                        'a_id' => $aid,
                        'str_val' => $set
                    );
                    if($isOption) $vals['o_id'] = $oid;
                    DB::table($tbl)
                        ->insert($vals);
                }
            } else {
                $vals = array(
                    ['f_id', '=', $fid],
                    ['a_id', '=', $aid]
                );
                if($isOption) $vals[] = ['o_id', '=', $oid];
                $valId = DB::table($tbl)
                    ->where($vals)
                    ->value('id');
                if($valId > 0) {
                    DB::table($tbl)
                        ->where('id', '=', $valId)
                        ->update(['str_val' => $value]);
                } else {
                    $vals = array(
                        'f_id' => $fid,
                        'a_id' => $aid,
                        'str_val' => $value
                    );
                    if($isOption) $vals['o_id'] = $oid;
                    DB::table($tbl)
                        ->insert($vals);
                }
            }
        }
        return response()->json(['fid' => $fid]);
    }

    public function set(Request $request) {
        $isUpdate = $request->has('realId');
        $name = $request->get('name');
        $root = $request->get('root');
        $cid = $request->get('cid');
        if($isUpdate) {
            $realId = $request->get('realId');
            DB::table('finds')
                ->where('id', $realId)
                ->update(['name' => $name]);
            $fid = $realId;
            $currAttrs = DB::table('context_values')->where('f_id', $realId)->get();
        } else {
            $fid = DB::table('finds')
                ->insertGetId([
                    'name' => $name,
                    'c_id' => $cid,
                    'root' => $root
                ]);
        }
        foreach($request->except('name', 'root', 'cid', 'realId') as $key => $value) {
            $aid = $key;
            if($isUpdate) {
                $alreadySet = false;
                $attr;
                foreach($currAttrs as $currKey => $currVal) {
                    if($aid == $currVal->a_id) {
                        $alreadySet = true;
                        $attr = $currVal;
                        unset($currAttrs[$currKey]);
                        break;
                    }
                }
                if($alreadySet) {
                    unset($attr->str_val);
                    $data = array('str_val' => $value);
                    DB::table('context_values')
                        ->where([$attr])
                        ->update($data);
                } else {
                    DB::table('context_values')
                        ->insert([
                            'f_id' => $fid,
                            'a_id' => $aid,
                            'str_val' => $value
                        ]);
                }
            } else {
                DB::table('context_values')
                    ->insert([
                        'f_id' => $fid,
                        'a_id' => $aid,
                        'str_val' => $value
                    ]);
            }
        }
        foreach($currAttrs as $currAttr) {
            DB::table('context_values')
                ->where('id', $currAttr->id)
                ->delete();
        }
        return response()->json(['fid' => $fid]);
    }

    public function delete($id) {
        DB::table('finds')
            ->where('id', $id)
            ->delete();
        DB::table('context_values')
            ->where('f_id', $id)
            ->delete();
    }
}
